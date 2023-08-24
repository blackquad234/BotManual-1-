const Discord = require("discord.js");
const sourcebin = require('sourcebin');
const config = require("./config.json");
const fs = require('fs');
const { QuickDB } = require("quick.db");
const { JsonDatabase } = require("wio.db");

// Database
global.db = new QuickDB();
global.dbJson = new JsonDatabase({
    databasePath: "./databases/myJsonDatabase.json",
});
//--

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessageReactions,
        '32767'
    ]
});

module.exports = client

client.on('interactionCreate', (interaction) => {

    if (interaction.type === Discord.InteractionType.ApplicationCommand) {

        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd) return interaction.reply({ content: `Erro, este comando não existe`, ephemeral: true });

        interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

        cmd.run(client, interaction)

    }
});

client.on("ready", () => {

    console.log(`👋 Olá`)
    console.log(`🤖 Meu nome é ${client.user.username}`)
    console.log(`💔 Eu tenho ${client.users.cache.size} amigos`)
    console.log(`👨 Mais do que ${client.guilds.cache.size} grupos me apoiam.`)
});

/*============================= | Anti OFF | =========================================*/

process.on('multipleResolves', (type, reason, promise) => {
     return;
 });
 process.on('unhandRejection', (reason, promise) => {
     return;
 });
process.on('uncaughtException', (error, origin) => {
     return;
 });
 process.on('uncaughtException', (error, origin) => {
     return;
 });


/*============================= | STATUS RICH PRESENCE | =========================================*/

client.on("ready", () => {
    let react = [
        `🤖 Duvidas?`,
        `🤖 Ajuda`,
        `🎫 Ticket`,
        `🏡 Meu papai: rdfpss#7777`, // TIRAR OS CRÉDITOS É FEIO =(
        `🌐 Version: v${require('discord.js').version.slice(0, 6)}`
    ],
        fera = 0;
    setInterval(() => client.user.setPresence({
        activities: [{
            name: `${react[fera++ % react.length]}`,
            type: Discord.ActivityType.Streaming,
            url: 'https://twitch.tv/discord'
        }]
    }), 1000 * 10);

    client.user
        .setStatus("Streaming");
});


/*============================= | Import handler | =========================================*/

client.slashCommands = new Discord.Collection()

require('./handler')(client)

client.login(config.client.token)

client.on('interactionCreate', require('./events/createProduct').execute)
client.on('interactionCreate', require('./events/showProduct').execute)
client.on('interactionCreate', require('./events/startCheckout').execute)
client.on('interactionCreate', require('./events/addStockProducts').execute)
client.on('interactionCreate', require('./events/editProduct').execute)

/*============================= | UPDATE PRODUCT | =========================================*/
setInterval(async () => {
    var row = await db.all();
    row = row.filter(p => p.id.startsWith('product_'));

    row.forEach(async product => {
        if (!product.value.channel) return;

        const channel = await client.channels.cache.get(product.value.channel.channelId)
        const message = await channel.messages.fetch(product.value.channel.messageId).catch(() => { })

        try {
            message.edit({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle(`${channel.guild.name} | Produto`)
                        //.setImage("https://media.discordapp.net/attachments/1081548021294190793/1098244922852790272/RD_STORE_logo.png")
                        //.setThumbnail(channel.guild.iconURL({ dynamic: true, format: "png", size: 4096 }))
                        .setDescription(`\`\`\`${product.value.body}\`\`\` \n**🛒 | Produto:** __${product.value.name}__\n**💸 | Preço:** __R$${product.value.value.toFixed(2)}__\n**📦 | Estoque:** __${product.value.stocks ? product.value.stocks.length : 0}__`)
                       // .setFooter({ text: `Para comprar clique no botão abaixo` })
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`sales-${product.value.id}`)
                                .setStyle(1)
                                .setEmoji('<:Carrinho_WJ:1050122076641562704>')
                                .setLabel('Adicionar ao Carrinho'))
                ]
            })
        } catch (error) {

        }
    });
}, 60000);
