from flask import Flask, send_file

app = Flask(__name__)

@app.route("/")
def index():
    return "<h1>Hello Flask with TLS!</h1>"

@app.route("/api/crl")
def download():
    return send_file("./certs/crl.pem", as_attachment=True, mimetype="application/pem")

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=3000,
        # ssl_context=("./certs/server.crt", "./certs/server.key"),
        # debug=True
    )
