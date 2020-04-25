"""
This submodule is designed to be invoked as a script.

E.g., `python -m spgill.pos.server`
"""

# stdlib imports
import os
import pathlib

# vendor imports
import flask
import gevent.pywsgi
from werkzeug.serving import run_with_reloader
from werkzeug.debug import DebuggedApplication


# Define the static directory in relation to this file
staticDir = str((pathlib.Path(__file__).parent / ".." / "build").resolve())
staticUrl = "/build"


# No-op function decorator
def noop(func):
    return func


# Initialize and configure the flask app
def createApp():
    app = flask.Flask(
        __name__, static_url_path=staticUrl, static_folder=staticDir
    )
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 megabytes, fyi
    app.config["DEBUG"] = os.environ.get("FLASK_DEBUG", "").lower() == "true"

    # THIS ROUTE COMES LAST
    # Any route that doesn't go to an actual file will return the index
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def route_catchall(path):
        return app.send_static_file("index.html")

    # Finally, return the app
    return app


def main():
    portNumber = int(os.environ.get("PORT", 5000))

    # Create the app
    app = createApp()

    print(f"Starting web server on http://localhost:{portNumber}")

    # If debug is enabled, wrap the app in the werkzeug debugger
    appDebug = app.config["DEBUG"]
    if appDebug:
        print("Starting in DEBUG mode")
        app = DebuggedApplication(app.wsgi_app, evalex=True)

    appDecorator = run_with_reloader if appDebug else noop

    # Start the server
    @appDecorator
    def runServer():
        gevent.pywsgi.WSGIServer(
            listener=("0.0.0.0", portNumber), application=app
        ).serve_forever()

    runServer()


if __name__ == "__main__":
    main()
