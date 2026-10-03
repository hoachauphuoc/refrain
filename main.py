from refrain import create_app

# The name the Cloud Run buildpack and `flask --app main` look for.
app = create_app()
