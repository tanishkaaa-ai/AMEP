"""
AMEP Backend API Routes
Flask REST API connecting frontend to AI engines

Implements endpoints for BR1-BR9
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime, timedelta
import uuid

# Import AI engines (from previous artifacts)
# from ai_engine.knowledge_tracing import HybridKnowledgeTracing
# from ai_engine.adaptive_practice import AdaptivePracticeEngine
# from ai_engine.engagement_detection import EngagementDetectionEngine

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ------------------------------------------------
# IMPORT ROUTES (this registers them)
# ------------------------------------------------
from api import engagement_routes
from api import mastery_routes
from api import pbl_routes
from api import analytics_routes


# Initialize AI engines
# kt_engine = HybridKnowledgeTracing()
# adaptive_engine = AdaptivePracticeEngine()
# engagement_engine = EngagementDetectionEngine()



# ============================================================================
# WEBSOCKET EVENTS FOR REAL-TIME UPDATES
# ============================================================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connected', {'message': 'Connected to AMEP server'})

@socketio.on('join_class')
def handle_join_class(data):
    """Student/teacher joins a class room"""
    class_id = data.get('class_id')
    print(f'User joined class: {class_id}')

@socketio.on('poll_response_submitted')
def handle_poll_response(data):
    """Broadcast poll response update to all clients"""
    emit('poll_updated', data, broadcast=True)

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)