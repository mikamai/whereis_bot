const Botkit = require('botkit')
const Witbot = require('witbot')

const slackToken = process.env.SLACK_TOKEN
console.log(process.env.WIT_TOKEN)
const witbot = Witbot(process.env.WIT_TOKEN)
const controller = Botkit.slackbot({ debug: false })

const checkins = [];

function valid(entity, entities) {
  return (entities[entity] && entities[entity].length > 0 && entities[entity][0].value && entities[entity][0].value.length > 0);
}

function entity(entity, entities) {
  return entities[entity][0].value;
}

controller.spawn({ token: slackToken }).startRTM(function (err, bot, payload) {
  if (err) throw new Error('Error connecting to Slack: ', err)
  console.log('Connected to Slack')
})

// wire up DMs and direct mentions to wit.ai
controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  var wit = witbot.process(message.text, bot, message)

  wit.hears('where_is', 0.55, function (bot, message, outcome) {
    bot.startConversation(message, function (_, convo) {
      if(valid('person', outcome.entities)) {
        let person = entity('person', outcome.entities)

        if(checkins[person]) {
          let info = checkins[person]
          convo.say(`${info.person} checked in to ${info.place} at ${info.date}`);
        } else {
          convo.say(`Cannot find checkin informations for ${person}`);
        }
      } else {
        convo.say('You forgot to tell me who you are looking for!');
      }
    })
  })

  wit.hears('check_in', 0.55, function (bot, message, outcome) {
    bot.startConversation(message, function (_, convo) {
      if(valid('person', outcome.entities) && valid('place', outcome.entities) ) {
        let person = entity('person', outcome.entities)
        let place  = entity('place', outcome.entities)

        checkins[person] = {person: person, place: place, date: new Date()};
        convo.say(`Hello ${person}! I've checked you in to ${place}`);
      } else {
        convo.say(`I can't check you in if you don't tell me who you are and where you wanna check in`);
      }
    })
  })

  wit.otherwise(function (bot, message) {
    bot.reply(message, 'You are so intelligent, and I am so simple. I don\'t understnd')
  })
})
