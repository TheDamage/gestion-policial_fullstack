from flask import Blueprint

whoiswho_bp = Blueprint('whoiswho', __name__)

from app.blueprints.whoiswho import routes