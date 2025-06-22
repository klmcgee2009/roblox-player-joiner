import requests
import os
from flask import Flask, request, jsonify
from collections import deque

app = Flask(__name__)

# Get your ROBLOSECURITY cookie from environment variables
ROBLOX_COOKIE = os.environ.get('ROBLOSECURITY')

if not ROBLOX_COOKIE:
    raise Exception("ROBLOSECURITY environment variable not set!")

HEADERS = {
    "Cookie": f".ROBLOSECURITY={ROBLOX_COOKIE}",
    "User-Agent": "Roblox-Connection-Finder"
}

def get_friends(user_id):
    url = f"https://friends.roblox.com/v1/users/{user_id}/friends"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json().get("data", [])
    else:
        print(f"Error fetching friends for {user_id}: {response.status_code}")
        return []

def bidirectional_bfs(start_user, target_user, max_depth=5):
    visited_start = {start_user: [start_user]}
    visited_target = {target_user: [target_user]}

    queue_start = deque([start_user])
    queue_target = deque([target_user])

    depth = 0

    while queue_start and queue_target and depth < max_depth:
        depth += 1

        # Expand from start side
        result = expand(queue_start, visited_start, visited_target)
        if result:
            return result
        
        # Expand from target side
        result = expand(queue_target, visited_target, visited_start, reverse=True)
        if result:
            return result

    return None  # No connection found

def expand(queue, visited_this_side, visited_other_side, reverse=False):
    current = queue.popleft()
    friends = get_friends(current)
    for friend in friends:
        friend_id = friend['id']
        if friend_id in visited_other_side:
            # Path found
            path_this = visited_this_side[current] + [friend_id]
            path_other = visited_other_side[friend_id]
            if reverse:
                return path_other + path_this[::-1][1:]
            else:
                return path_this + path_other[::-1][1:]
        if friend_id not in visited_this_side:
            visited_this_side[friend_id] = visited_this_side[current] + [friend_id]
            queue.append(friend_id)
    return None

@app.route('/')
def home():
    return "Roblox Connection Finder API is running!"

@app.route('/findConnection', methods=['POST'])
def find_connection():
    data = request.get_json()
    start_user = data.get('startUserId')
    target_user = data.get('targetUserId')

    if not start_user or not target_user:
        return jsonify({"error": "Missing startUserId or targetUserId"}), 400

    path = bidirectional_bfs(int(start_user), int(target_user))
    if path:
        return jsonify({
            "connectionPath": path,
            "depth": len(path)-1
        })
    else:
        return jsonify({"message": "No connection found"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
