const Discord = require("discord.js")
const config = require('../../config.json')

module.exports = {
    name: "criar", // Coloque o nome do comando
    description: "🛒 [BOT-VENDAS] Adicionar novo produto a venda!", // Coloque a descrição do comando
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
            content: `❌ | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
            ephemeral: true,
        })

        return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    //.setTitle('Cadastrar produto!')
                    .setDescription('Para cadastrar um novo produto, use o **botão** abaixo, e preencha as informações a seguir.')
            ],
            ephemeral: true,
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('create_product')
                            //.setEmoji('<:add:1098831653947842580>')
                            .setLabel('Criar produto')
                            .setStyle(1)
                    )
            ],
        })
    }
}