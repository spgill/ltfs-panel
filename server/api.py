# stdlib imports
import json
import re
import subprocess

# vendor imports
import flask
import xattr


mountLocation = "/mnt/ltfs"
patterns = {
    "lsscsi": re.compile(
        r"(\[.*?\]) +tape {2,}(.*?) {2,}(.*?) {2,}.*?(\/dev\/st\d+) +(\/dev\/sg\d+)"
    ),
    "mount": re.compile(r"ltfs:(\/dev.*?) on (.*?) type fuse"),
}


def queryDevices():
    proc = subprocess.run(["lsscsi", "-g",], capture_output=True)
    match = patterns["lsscsi"].search(proc.stdout.decode())
    if match:
        return {
            "bus": match[1],
            "manufacturer": match[2],
            "model": match[3],
            "device": match[4],
            "generic": match[5],
        }


def queryMountPoints():
    proc = subprocess.run(["mount"], capture_output=True)
    result = proc.stdout.decode().splitlines()
    for line in result:
        match = patterns["mount"].match(line)
        if match is not None:
            return {
                "generic": match[1],
                "location": match[2],
                "serial": xattr.xattr(match[2])
                .get("user.ltfs.volumeSerial")
                .decode(),
            }


def queryTapeExistence():
    dev = queryDevices()
    if dev is None:
        return False

    proc = subprocess.run(
        ["mt", "-f", dev["device"], "status"], capture_output=True
    )
    result = proc.stdout.decode()
    return result.find("ONLINE") >= 0


def createBlueprint():  # noqa: C901
    # Create the blueprint
    blueprint = flask.Blueprint("api", __name__)

    @blueprint.route("/api/status", methods=["GET"])
    def api_status():
        return {
            "device": queryDevices(),
            "mount": queryMountPoints(),
            "tape": queryTapeExistence(),
        }

    @blueprint.route("/api/mount", methods=["PUT"])
    def api_mount():
        if queryMountPoints():
            return json.dumps("already mounted")

        dev = queryDevices()
        subprocess.run(
            ["ltfs", "-o", f"devname={dev['generic']}", mountLocation]
        )
        return json.dumps("success")

    @blueprint.route("/api/unmount", methods=["PUT"])
    def api_unmount():
        if not queryMountPoints():
            return json.dumps("not mounted")

        subprocess.run(["umount", mountLocation])
        return json.dumps("success")

    @blueprint.route("/api/eject", methods=["PUT"])
    def api_eject():
        if queryMountPoints():
            return json.dumps("please unmount first")

        dev = queryDevices()
        subprocess.run(["mt", "-f", dev["device"], "eject"])
        return json.dumps("success")

    @blueprint.route("/api/load", methods=["PUT"])
    def api_load():
        dev = queryDevices()
        subprocess.run(["mt", "-f", dev["device"], "load"])
        return json.dumps("success")

    return blueprint
