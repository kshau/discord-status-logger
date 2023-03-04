require("dotenv").config();
const WebSocket = require("ws");
const {fetch} = require("undici");

const {TOKEN, WEBHOOK_URL} = process.env;

var statuses = {};

async function webhookMsg(url, content) {
  if (content != undefined) {
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
      if (t == "PRESENCE_UPDATE" && d.activities != undefined && d.activities.length > 0) {

        var status = d.activities[0];
        var userId = d.user.id;
        
        switch (status.name) {
            case "Custom Status":
                if (statuses[userId] == undefined) {
                    statuses[userId] = {type: "", content: ""};
                }
                if (statuses[userId].type != "Custom Status" || statuses[userId].content != status.state) {
                    statuses[userId] = {type: "Custom Status", content: status.state};
                    webhookMsg(WEBHOOK_URL, `<@${userId}> - \`${status.state}\``);
                }
                break;
            case "Spotify":
                if (statuses[userId] == undefined) {
                    statuses[userId] = {type: "Spotify", song: ""};
                }
                if (statuses[userId].type != "Spotify" || statuses[userId].song != status.details) {
                    statuses[userId] = {type: "Spotify", song: status.details};
                    webhookMsg(WEBHOOK_URL, `<@${userId}> - Listening to **Spotify** (\`${statuses[userId].song}\` by __${status.state}__)`);
                }
                break;
            default:
                if (statuses[userId] == undefined) {
                    statuses[userId] = {type: "Playing", activity: ""};
                }
                if (statuses[userId].type != "Playing" || statuses[userId].activity != status.name) {
                    statuses[userId] = {type: "Playing", activity: status.name};
                    webhookMsg(WEBHOOK_URL, `<@${userId}> - Playing **${status.name}**`);
                }
                break;

            }
      }
    }
      
    catch (err) {
      console.log(err);
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
