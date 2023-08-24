const Discord = require("discord.js")
const config = require('../../config.json')

module.exports = {
    name: "addstock", // Coloque o nome do comando
    description: "🛒 [BOT-VENDAS] Adicionar estoque aos produtos!", // Coloque a descrição do comando
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
                    .setTitle('Adicionar estoque')
                    .setDescription('Clique no **botão abaixo** para adicionar novos estoque aos produtos!\nDeseja adicionar 10x contas? Você deverá adicionar uma por uma.')
            ],
            ephemeral: true,
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('addstockproducts')
                            // .setEmoji('<:maismc:1080252104419065937>')
                            .setLabel('Adicionar estoque')
                            .setStyle(1)
                    )
            ]
        })
    }
}