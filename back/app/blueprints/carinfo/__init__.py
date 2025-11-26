from flask import Blueprint

carinfo_bp = Blueprint('carinfo', __name__)

from app.blueprints.carinfo import routes