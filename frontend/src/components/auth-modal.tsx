/**
 * Auth Modal Component
 *
 * v0で生成されたモダンなデザインを適用した認証モーダル
 * AWS Amplify認証を統合
 */

import { useEffect, useState } from "react";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { showAuthModal, closeAuthModal, onAuthSuccess } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // モーダルが開いている間、bodyのスクロールを無効化
  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAuthModal]);

  // モーダルが閉じられたときに状態をリセット
  useEffect(() => {
    if (!showAuthModal) {
      setMode("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setConfirmationCode("");
      setErrors({});
    }
  }, [showAuthModal]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email) {
      newErrors.email = "メールアドレスは必須です";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }

    // Password validation
    if (!password) {
      newErrors.password = "パスワードは必須です";
    } else if (password.length < 8) {
      newErrors.password = "パスワードは8文字以上である必要があります";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "パスワードは大文字、小文字、数字を含む必要があります";
    }

    // Confirm password validation for signup
    if (mode === "signup") {
      if (!confirmPassword) {
        newErrors.confirmPassword = "パスワードの確認が必要です";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "パスワードが一致しません";
      }
    }

    // Confirmation code validation
    if (mode === "confirm") {
      if (!confirmationCode) {
        newErrors.confirmationCode = "確認コードは必須です";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await signIn({
        username: email,
        password,
      });
      onAuthSuccess();
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.name === "NotAuthorizedException") {
        setErrors({
          password: "メールアドレスまたはパスワードが正しくありません",
        });
      } else if (error.name === "UserNotConfirmedException") {
        setErrors({
          email:
            "アカウントが確認されていません。確認コードを入力してください。",
        });
        setMode("confirm");
      } else {
        setErrors({
          email: error.message || "ログインに失敗しました",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setMode("confirm");
      } else {
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.name === "UsernameExistsException") {
        setErrors({
          email: "このメールアドレスは既に登録されています",
        });
      } else if (error.name === "InvalidPasswordException") {
        setErrors({
          password: error.message || "パスワードの形式が正しくありません",
        });
      } else {
        setErrors({
          email: error.message || "サインアップに失敗しました",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      // 確認成功後、ログインモードに切り替え
      setMode("login");
      setConfirmationCode("");
      setErrors({});
      // 自動的にログインを試みる
      try {
        await signIn({
          username: email,
          password,
        });
        onAuthSuccess();
      } catch {
        // ログイン失敗時はログインフォームを表示
      }
    } catch (error: any) {
      console.error("Confirm sign up error:", error);
      if (error.name === "CodeMismatchException") {
        setErrors({
          confirmationCode: "確認コードが正しくありません",
        });
      } else if (error.name === "ExpiredCodeException") {
        setErrors({
          confirmationCode: "確認コードの有効期限が切れています",
        });
      } else {
        setErrors({
          confirmationCode: error.message || "確認に失敗しました",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "login") {
      handleSignIn(e);
    } else if (mode === "signup") {
      handleSignUp(e);
    } else if (mode === "confirm") {
      handleConfirmSignUp(e);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "login" ? "signup" : "login";
    setMode(newMode);
    setErrors({});
    setPassword("");
    setConfirmPassword("");
    setConfirmationCode("");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  if (!showAuthModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors duration-200"
          aria-label="閉じる"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-foreground mb-2 text-balance">
              {mode === "login"
                ? "おかえりなさい"
                : mode === "signup"
                ? "アカウント作成"
                : "確認コード入力"}
            </h2>
            <p className="text-muted-foreground text-pretty">
              {mode === "login"
                ? "ノートにアクセスするためにサインインしてください"
                : mode === "signup"
                ? "今日から思考を整理しましょう"
                : "メールに送信された確認コードを入力してください"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            {mode !== "confirm" && (
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="メールアドレスを入力"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-11 transition-all duration-200 bg-secondary/50 border-border focus:border-primary focus:bg-card",
                    errors.email &&
                      "border-destructive focus:border-destructive"
                  )}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.email}
                  </p>
                )}
              </div>
            )}

            {/* Password field */}
            {mode !== "confirm" && (
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-11 transition-all duration-200 bg-secondary/50 border-border focus:border-primary focus:bg-card",
                    errors.password &&
                      "border-destructive focus:border-destructive"
                  )}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.password}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password field (signup only) */}
            {mode === "signup" && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  パスワード（確認）
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="パスワードを再度入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-11 transition-all duration-200 bg-secondary/50 border-border focus:border-primary focus:bg-card",
                    errors.confirmPassword &&
                      "border-destructive focus:border-destructive"
                  )}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Confirmation Code field */}
            {mode === "confirm" && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmationCode"
                  className="text-sm font-medium text-foreground"
                >
                  確認コード
                </Label>
                <Input
                  id="confirmationCode"
                  type="text"
                  placeholder="6桁の確認コードを入力"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className={cn(
                    "h-11 transition-all duration-200 bg-secondary/50 border-border focus:border-primary focus:bg-card",
                    errors.confirmationCode &&
                      "border-destructive focus:border-destructive"
                  )}
                  disabled={isLoading}
                  maxLength={6}
                />
                {errors.confirmationCode && (
                  <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                    {errors.confirmationCode}
                  </p>
                )}
              </div>
            )}

            {/* Forgot password link (login only) */}
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 transition-colors duration-200"
                  disabled={isLoading}
                >
                  パスワードをお忘れですか？
                </button>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {mode === "login"
                    ? "サインイン中..."
                    : mode === "signup"
                    ? "アカウント作成中..."
                    : "確認中..."}
                </span>
              ) : mode === "login" ? (
                "サインイン"
              ) : mode === "signup" ? (
                "アカウント作成"
              ) : (
                "確認"
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "アカウントをお持ちでないですか？"
                  : "既にアカウントをお持ちですか？"}{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                  disabled={isLoading}
                >
                  {mode === "login" ? "サインアップ" : "サインイン"}
                </button>
              </p>
            </div>
          )}

          {/* Back to login link (confirm mode) */}
          {mode === "confirm" && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setConfirmationCode("");
                  setErrors({});
                }}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                サインインに戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
