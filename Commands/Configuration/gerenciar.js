const Discord = require("discord.js")
const config = require('../../config.json');

module.exports = {
    name: "gerenciar", // Coloque o nome do comando
    description: "🛒 [BOT-VENDAS] Gerenciar um produto da loja", // Coloque a descrição do comando
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({
            content: `❌ | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!`,
            ephemeral: true,
        })

        var row = await db.all();
        row = row.filter(p => p.id.startsWith('product_'));

        if (row.length < 1) return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription('Não há produtos cadastrados no momento.\nUtilize \`/criar\` para começar.')
            ]
        })

        const options = [];

        row.forEach(product => {
            options.push({ label: `${product.value.name} [${product.value.id}]`, value: `${product.value.id}` })
        });

        return interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setTitle('Exibir produto')
                    .setDescription('Selecione um produto no **menu** abaixo.\nAssim para gerenciar o produto.')
            ],
            ephemeral: true,
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.SelectMenuBuilder()
                            .setCustomId('edit_product')
                            .setPlaceholder('Selecione um produto!')
                            .addOptions(options)
                    )
            ]
        })
    }
}