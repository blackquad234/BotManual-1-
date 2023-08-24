const Discord = require('discord.js')
const config = require('../config.json')

/*============================= | Create Product | =========================================*/
module.exports = {
    name: 'showProduct',
    async execute(interaction) {
        if (interaction.isSelectMenu() && interaction.customId.startsWith("show_product")) {
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
                content: `❌ | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
                ephemeral: true,
            })

            const product_id = interaction.values[0];

            const row = await db.get(`product_${product_id}`);
            if (row.length < 1) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle('Produto não encontrado!')
                        .setDescription('Este produto não foi encontrado no banco de dados!')
                ]
            })

            const message = await interaction.channel.send({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle(`${interaction.guild.name} | Produto`)
                        //.setImage(`https://cdn.discordapp.com/attachments/1092108332812210319/1092109765930405898/Screenshot_5.png`)
                        .setDescription(`\`\`\`${row.body}\`\`\` \n**🛒 | Nome:** __${row.name}__\n**💸 | Preço:** __R$${row.value.toFixed(2)}__\n**📦 | Estoque:** __${row.stocks ? row.stocks.length : 0}__`)
                       // .setFooter({ text: `Para comprar clique no botão abaixo` })
                ],
                components: [
                    new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`sales-${product_id}`)
                                .setStyle(1)
                                .setEmoji('<:Carrinho_WJ:1050122076641562704>')
                                .setLabel('Adicionar ao Carrinho')
                        )
                ]
            })

            const data = {
                channelId: interaction.channelId,
                messageId: message.id
            }

            db.set(`product_${product_id}.channel`, data)

            return interaction.reply({ content: '✅ | Produto exibido com sucesso!', ephemeral: true })
        }
    }
}