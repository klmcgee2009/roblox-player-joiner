from flask import Flask, request, jsonify
from collections import deque

app = Flask(__name__)

# === MOCK DATABASE OF FRIENDS ===
mock_friends = {
    1000: [1001, 1002, 1003],
    1001: [1004, 1005],
    1002: [1006],
    1003: [1007, 1008],
    1004: [1009],
    1005: [1010],
    1010: [2000],   # link path to famous person (2000)
    2000: [2001, 2002],
    2001: [2003],
    2003: [3000],
    3000: [],
}

# === Function to simulate getting friends ===
def get_friends(user_id):
    return mock_friends.get(user_id, [])

# === Bidirectional BFS search ===
def bidirectional_search(playerA, playerB):
    if playerA == playerB:
        return [playerA]

    visitedA = {playerA: [playerA]}
    visitedB = {playerB: [playerB]}
    queueA = deque([playerA])
    queueB = deque([playerB])

    while queueA and queueB:
        result = expand(queueA, visitedA, visitedB)
        if result:
            return result

        result = expand(queueB, visitedB, visitedA)
        if result:
            return result

    return None

def expand(queue, visited_this_side, visited_other_side):
    for _ in range(len(queue)):
        current = queue.popleft()
        friends = get_friends(current)
        for friend in friends:
            if friend in visited_other_side:
                return visited_this_side[current] + visited_other_side[friend][::-1]
            if friend not in visited_this_side:
                visited_this_side[friend] = visited_this_side[current] + [friend]
                queue.append(friend)
    return None

@app.route('/find-path', methods=['POST'])
def find_path():
    data = request.get_json()
    playerA = data.get('playerA')
    playerB = data.get('playerB')

    if not playerA or not playerB:
        return jsonify({'error': 'Missing playerA or playerB'}), 400

    path = bidirectional_search(playerA, playerB)

    if path:
        return jsonify({'path': path})
    else:
        return jsonify({'message': 'No connection found'}), 404

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
