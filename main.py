import requests
import os
import time
from flask import Flask, request, jsonify
from collections import deque

app = Flask(__name__)

# Get ROBLOSECURITY cookie from environment variable
ROBLOX_COOKIE = os.environ.get('ROBLOSECURITY')
if not ROBLOX_COOKIE:
    raise Exception("ROBLOSECURITY environment variable not set!")

HEADERS = {
    "Cookie": f".ROBLOSECURITY={ROBLOX_COOKIE}",
    "User-Agent": "Roblox-Connection-Finder"
}

# Global counters
api_calls = 0
total_scanned = 0

def get_friends(user_id):
    global api_calls
    api_calls += 1
    url = f"https://friends.roblox.com/v1/users/{user_id}/friends"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json().get("data", [])
    else:
        print(f"Error fetching friends for {user_id}: {response.status_code}")
        return []

def bidirectional_bfs(start_user, target_user, max_depth=5):
    global total_scanned
    visited_start = {start_user: [start_user]}
    visited_target = {target_user: [target_user]}
    queue_start = deque([start_user])
    queue_target = deque([target_user])
    depth = 0

    while queue_start and queue_target and depth < max_depth:
        depth += 1

        # Expand start side
        result = expand(queue_start, visited_start, visited_target, from_start=True)
        if result:
            return result

        # Expand target side
        result = expand(queue_target, visited_target, visited_start, from_start=False)
        if result:
            return result

    return None

def expand(queue, visited_this_side, visited_other_side, from_start=True):
    global total_scanned
    if not queue:
        return None
    current = queue.popleft()
    total_scanned += 1
    friends = get_friends(current)

    for friend in friends:
        friend_id = friend['id']
        if friend_id in visited_other_side:
            path_this = visited_this_side[current] + [friend_id]
            path_other = visited_other_side[friend_id]
            if from_start:
                full_path = path_this + path_other[::-1][1:]
            else:
                full_path = path_other + path_this[::-1][1:]
            return full_path

        if friend_id not in visited_this_side:
            visited_this_side[friend_id] = visited_this_side[current] + [friend_id]
            queue.append(friend_id)

    return None

@app.route('/')
def home():
    return "Roblox Connection Finder API is running!"

@app.route('/findConnection', methods=['POST'])
def find_connection():
    global api_calls, total_scanned
    data = request.get_json()
    start_user = data.get('startUserId')
    target_user = data.get('targetUserId')

    if not start_user or not target_user:
        return jsonify({"error": "Missing startUserId or targetUserId"}), 400

    # Reset counters
    api_calls = 0
    total_scanned = 0

    start_time = time.time()
    path = bidirectional_bfs(int(start_user), int(target_user))
    end_time = time.time()

    if path:
        players_between = path[1:-1]
        return jsonify({
            "connectionPath": path,
            "playersBetween": players_between,
            "depth": len(path)-1,
            "totalScanned": total_scanned,
            "totalApiCalls": api_calls,
            "timeTakenSeconds": round(end_time - start_time, 3)
        }), 200
    else:
        return jsonify({
            "message": "No connection found",
            "totalScanned": total_scanned,
            "totalApiCalls": api_calls,
            "timeTakenSeconds": round(end_time - start_time, 3)
        }), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
