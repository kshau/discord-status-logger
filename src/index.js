require("dotenv").config();
const WebSocket = require("ws");
const {fetch} = require("undici");

const {createUser, setUserAttributes, getUser, hasUser} = require("./mongo/dbManager");

const {TOKEN, WEBHOOK_URL} = process.env;

async function webhookMsg(url, content) {
  if (content != "undefined") {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
      }, 
      body: JSON.stringify({
        username: "Status Logger", 
        content: content
      })
    })
  }
    
}

function wsConnect() {

  var ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
  var interval;

  ws.on("open", () => {

    ws.send(JSON.stringify({
      "op": 2,
      "d": {
        "token": TOKEN,
        "properties": {
          "os": "linux",
          "browser": "chrome"
        }
      }
    }))

  })


  ws.on("message", (data) => {

    var json = JSON.parse(data);

    var {op, t, d} = json;
    
    try {

      if (t == "PRESENCE_UPDATE" && d.activities != undefined && d.activities.length > 0 && d.last_modified != undefined) {

        var status = d.activities[0];
        var userId = d.user.id;

        hasUser(userId).then(has => {

          if (!has) {
            createUser(userId);
          }
          
          getUser(userId).then(data => {
            if (data != undefined && status != undefined) {
              switch (status.name) {
                case "Custom Status":
                  if (data.status != `[${status.emoji.name}] ${status.state}` || data.statusType != "Custom Status") {
                    setUserAttributes(userId, [{key: "statusType", value: "Custom Status"}, {key: "status", value: `[${status.emoji.name}] ${status.state}`}]);
                    webhookMsg(WEBHOOK_URL, `:keyboard: <@${userId}> - ${status.emoji.name} \`${status.state}\``);
                  }
                  break;
                case "Spotify":
                  if (data.status != status.details || data.statusType != "Spotify") {
                    setUserAttributes(userId, [{key: "statusType", value: "Spotify"}, {key: "status", value: status.details}]);
                    webhookMsg(WEBHOOK_URL, `:musical_note: <@${userId}> - Listening to **Spotify** (\`${status.details}\` by __${status.state}__)`);
                  }
                  break;
                default:
                  if (data.status != status.name || data.statusType != "Playing") {
                    setUserAttributes(userId, [{key: "statusType", value: "Playing"}, {key: "status", value: status.name}]);
                    webhookMsg(WEBHOOK_URL, `:video_game: <@${userId}> - Playing **${status.name}**`);
                  }
                  break;
              }
            }
          })
          
        })
        
      }
    }
      
    catch (err) {
      console.error(err);
    }

      if (op == 10) {
        interval = d.heartbeat_interval;
        setInterval(ms => {
          ws.send(JSON.stringify({
            op: 1,
            d: null
          }))
        }, interval)
      }
      
  })

  ws.on("close", wsConnect);

}

wsConnect();