# Flask controller for Sunstone REST API
from flask import Blueprint, request, jsonify
import sqlite3
import os

AUDIT_DB = '/var/lib/one/oneaudit.db'

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/audit', methods=['GET'])
def get_audit():
    """
    Query audit trail. Parameters: user, start, end, object, request
    """
    if not os.path.exists(AUDIT_DB):
        return jsonify({'error': 'Audit database not found'}), 500
    
    conn = sqlite3.connect(AUDIT_DB)
    cursor = conn.cursor()
    
    where_clauses = []
    params = []
    
    user = request.args.get('user')
    if user:
        where_clauses.append('user_id = ?')
        params.append(int(user))
    
    start = request.args.get('start')
    if start:
        where_clauses.append('timestamp >= ?')
        params.append(int(start))
    
    end = request.args.get('end')
    if end:
        where_clauses.append('timestamp <= ?')
        params.append(int(end))
    
    obj = request.args.get('object')
    if obj:
        where_clauses.append('objects LIKE ?')
        params.append(f'%{obj}%')
    
    req_type = request.args.get('request')
    if req_type:
        where_clauses.append('request = ?')
        params.append(req_type)
    
    where = ' AND '.join(where_clauses) if where_clauses else '1=1'
    sql = f'SELECT * FROM audit_trail WHERE {where}'
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    
    entries = []
    for row in rows:
        entries.append({
            'id': row[0],
            'timestamp': row[1],
            'user_id': row[2],
            'request': row[3],
            'args': row[4],
            'result': row[5],
            'objects': row[6],
            'acl_rule_id': row[7],
            'session_cached': bool(row[8])
        })
    
    return jsonify(entries)