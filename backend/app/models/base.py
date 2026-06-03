# Import Base here so it is easily accessible by Alembic
from app.core.database import Base

# Also import all models here so Alembic detects them
from app.models.user import User
from app.models.farmer import Farmer
from app.models.farm import Farm
from app.models.tree import Tree
from app.models.adoption import Adoption
from app.models.ceremony import Ceremony
from app.models.memory import TreeMemory
from app.models.harvest import Harvest
from app.models.delivery import Delivery
from app.models.payment import Payment
from app.models.notification import Notification
#testind