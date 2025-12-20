import json
import os
import boto3
from datetime import datetime

# DynamoDBクライアント
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(table_name) if table_name else None

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }

def handler(event, context):
    method = event.get("httpMethod")
    path = event.get("path", "")

    if method == "GET" and path == "/notes":
        return response(200, {"message": "ノート一覧取得 (仮)"})
    elif method == "POST" and path == "/notes":
        return response(201, {"message": "ノート新規作成 (仮)"})
    elif method == "GET" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        return response(200, {"message": f"ノート取得（仮）: {note_id}"})
    elif method == "PUT" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        return response(200, {"message": f"ノート更新（仮）: {note_id}"})
    elif method == "DELETE" and path.startswith("/notes/"):
        note_id = path.split("/notes/")[-1]
        return response(200, {"message": f"ノート削除（仮）: {note_id}"})
    else:
        return response(404, {"error": "Not Found"})

def get_users(event, headers):
    """ユーザー一覧を取得"""
    try:
        # クエリパラメータからuserIdを取得
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('userId')
        
        if user_id:
            # 特定ユーザーの取得
            response = table.get_item(Key={'userId': user_id})
            if 'Item' in response:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(response['Item'])
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'User not found'})
                }
        else:
            # 全ユーザーの取得（スキャン）
            response = table.scan()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(response.get('Items', []))
            }
    except Exception as e:
        raise e

def create_user(event, headers):
    """ユーザーを作成"""
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # ユーザー情報を保存
        item = {
            'userId': user_id,
            'email': body.get('email', ''),
            'name': body.get('name', ''),
            'createdAt': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(item)
        }
    except Exception as e:
        raise e

