const Discord = require('discord.js')
const config = require('../config.json')
const moment = require("moment")
moment.locale("pt-br");
const mercadopago = require('mercadopago');
/*============================= | Create Product | =========================================*/
module.exports = {
    name: 'startCheckout',
    async execute(interaction) {
        if (interaction.isButton() && interaction.customId.startsWith("sales-")) {
            const product_id = interaction.customId.slice(interaction.customId.indexOf('-')).replace('-', '')
            const row = await db.get(`product_${product_id}`);

            if (!row) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle('Produto não encontrado!')
                        .setDescription('Este produto pode não estar mais disponível!')
                ],
                ephemeral: true
            })

            if (!row.stocks || row.stocks.length < 1) return interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setTitle('Produto sem estoque!')
                        .setDescription('Este produto está sem estoque no momento, volte mais tarde!')
                ],
                ephemeral: true
            })

            if (interaction.guild.channels.cache.find(c => c.name === `carrinho-${interaction.user.id}`)) {
                return interaction.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.client.embed)
                            .setTitle('Carrinho')
                            .setDescription(`Você já possui um carrinho aberto, finalize a compra para abrir um novo!`)
                    ],
                    ephemeral: true,
                })
            }

            interaction.guild.channels.create({
                name: `carrinho - ${interaction.user.id}`,
                type: 0,
                parent: config.sales.checkout_category_id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"]
                    },
                    {
                        id: interaction.user.id,
                        allow: ["ViewChannel"],
                        deny: ["SendMessages", "AttachFiles", "AddReactions"]
                    }
                ]
            }).then(async (channel) => {
                interaction.reply({ content: `**✅ | ${interaction.user} Seu carrinho foi aberto com sucesso em: ${channel}**`, ephemeral: true })

                var qrcode = true;
                var pix = true;
                var quantity = 1;
                var product_price = row.value * quantity

                const protocol = Math.floor(Math.random() * 900000) + 100000;;

                channel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.client.embed)
                            //.setTitle('Sistema de compra')
                            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, format: "png", size: 4096 }))
                            .setDescription('```Seu carrinho foi criado com sucesso, informações:```')
                            .addFields([
                                { name: '\`🛒\` | Produto', value: `__${row.name}__`, inline: true },
                                { name: '\`📦\` | Quantidade', value: `__${quantity} item(s)__`, inline: true },
                                { name: '\`💵\` | Preço', value: `__R$${(row.value * quantity).toFixed(2)}__`, inline: true },
                            ])
                    ],
                    components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                .setCustomId(`remove_checkout_product`)
                                .setStyle(2)
                                .setLabel('-'),
                            new Discord.ButtonBuilder()
                                .setCustomId(`add_checkout_product`)
                                .setStyle(2)
                                .setLabel('+'),
                                new Discord.ButtonBuilder()
                                    .setCustomId(`confirm_checkout_product`)
                                    .setStyle(3)
                                    .setEmoji('<a:certo1:1050469700250910730>')
                                    .setLabel('Finalizar'),
                                new Discord.ButtonBuilder()
                                    .setCustomId(`cancel_checkout`)
                                    .setStyle(4)
                                    .setEmoji('<a:errado1:1050469730005299270>')
                                    .setLabel('Cancelar')
                            ),
                    ]
                }).then(async msg => {
                    const filter = i => i.member.id === interaction.user.id;
                    const collector = msg.createMessageComponentCollector({ filter });
                    collector.on('collect', interaction2 => {
                        if (interaction2.customId === "remove_checkout_product") {
                            if (quantity <= 1) return interaction2.reply({ content: `❌ | Você não pode deixar o stock abaixo de 0`, ephemeral: true })

                            quantity -= 1;

                            product_price = row.value * quantity;

                            interaction2.update({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
//                                         .setTitle('Sistema de compra')
                                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, format: "png", size: 4096 }))
                                        .setDescription('```Seu carrinho foi criado com sucesso, informações:```')
                                        .addFields([
                                            { name: '\`🛒\` | Produto', value: `__${row.name}__`, inline: true },
                                            { name: '\`📦\` | Quantidade', value: `__${quantity} item(s)__`, inline: true },
                                            { name: '\`💵\` | Preço', value: `__R$${(row.value * quantity).toFixed(2)}__`, inline: true },
                                        ])
                                ],
                                components: [
                                    new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`remove_checkout_product`)
                                                .setStyle(2)
                                                .setLabel('-'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`add_checkout_product`)
                                                .setStyle(2)
                                                .setLabel('+'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`confirm_checkout_product`)
                                                .setStyle(3)
                                                .setEmoji('<a:certo1:1050469700250910730>')
                                                .setLabel('Finalizar'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`cancel_checkout`)
                                                .setStyle(4)
                                                .setEmoji('<a:errado1:1050469730005299270>')
                                                .setLabel('Cancelar'),
                                        ),
                                ]
                            });
                        } else if (interaction2.customId === "add_checkout_product") {
                            if (quantity >= row.stocks.length) return interaction2.reply({ content: `Você não pode adicionar o stock acima do valor`, ephemeral: true })

                            quantity += 1;

                            product_price = row.value * quantity;

                            interaction2.update({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
//                                         .setTitle('Sistema de compra')
                                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, format: "png", size: 4096 }))
                                        .setDescription('```Seu carrinho foi criado com sucesso, informações:```')
                                        .addFields([
                                            { name: '\`🛒\` | Produto', value: `__${row.name}__`, inline: true },
                                            { name: '\`📦\` | Quantidade', value: `__${quantity} item(s)__`, inline: true },
                                            { name: '\`💵\` | Preço', value: `__R$${(row.value * quantity).toFixed(2)}__`, inline: true },
                                        ])
                                ],
                                components: [
                                    new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`remove_checkout_product`)
                                                .setStyle(2)
                                                .setLabel('-'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`add_checkout_product`)
                                                .setStyle(2)
                                                .setLabel('+'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`confirm_checkout_product`)
                                                .setStyle(3)
                                                .setEmoji('<a:certo1:1050469700250910730>')
                                                .setLabel('Finalizar'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`cancel_checkout`)
                                                .setStyle(4)
                                                .setEmoji('<a:errado1:1050469730005299270>')
                                                .setLabel('Cancelar'),
                                        ),
                                ]
                            });
                        } else if (interaction2.customId === "cancel_checkout") {
                            interaction2.channel.delete().then(() => {
                                interaction2.user.send({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor(config.client.embed)
                                            .setTitle('Pedido cancelado')
                                            .setDescription(`Olá ${interaction.user}, Você cancelou a compra e o stock foi devolvido, volte a comprar quando quiser.`)
                                
                                    ]
                                })
                            })
                        } else if (interaction2.customId === "confirm_checkout_product") {
                            interaction2.message.delete()
                            interaction2.channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.client.embed)
                                        // .setTitle('Pagamento')
                                        .setDescription('```Após realiar o pagamento envie o comprovante no canal para que seja analizado sua compra!\n\nRealize o pagamento do(s) produto(s) informações:```')
                                        .addFields([
                                            { name: '\`🛒\` | Produto', value: `__${row.name}__`, inline: true },
                                            { name: '\`📦\` | Quantidade', value: `__${quantity} item(s)__`, inline: true },
                                            { name: '\`💵\` | Preço', value: `__R$${(row.value * quantity).toFixed(2)}__`, inline: true },
                                        ])
                                ],
                                components: [
                                    new Discord.ActionRowBuilder()
                                        .addComponents(
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`qrcode_checkout_product1`)
                                                .setStyle(1)
                                                .setEmoji('<:qrcode:1086309485376700486>')
                                                .setLabel('QR Code'),
                                                new Discord.ButtonBuilder()
                                                .setCustomId(`codigo`)
                                                .setStyle(1)
                                                .setEmoji('<:copiar:1098840275142582345>')
                                                .setLabel('Chave Aleatória'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`cancel_checkout`)
                                                .setStyle(4)
                                                .setEmoji('<a:errado1:1050469730005299270>')
                                                .setLabel('Fechar Carrinho'),
                                            new Discord.ButtonBuilder()
                                                .setCustomId(`confirm_payment_checkout`)
                                                .setStyle(3)
                                                .setEmoji('<a:certo1:1050469700250910730>')
                                                .setLabel('Confirmar o Pagamento'),
                                        ),
                                ]
                            }).then(async msg => {
                                interaction2.channel.edit({
                                    permissionOverwrites: [
                                        {
                                            id: interaction2.guild.id,
                                            deny: ["ViewChannel"]
                                        },
                                        {
                                            id: interaction2.user.id,
                                            allow: ["ViewChannel", "SendMessages", "AttachFiles"],
                                            deny: ["AddReactions"]
                                        }
                                    ]
                                })
                                const collector = msg.createMessageComponentCollector();

                                collector.on('collect', async interaction => {
                                    if (interaction.customId === "qrcode_checkout_product1") {
                                        interaction.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle("✅ | QR CODE GERADO COM SUCESSO:")
                                                    .setColor(config.client.embed)
                                                    .setImage(config.sales.banco.qrcode)
                                            ],   ephemeral: true
                                        })

                                        interaction.update({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    // .setTitle('Pagamento')
                                                    .setDescription('```Após realizar o pagamento envie o comprovante no canal para que seja analizado sua compra!\n\nRealize o pagamento do(s) produto(s) informações:```')
                                                    .setImage("https://cdn.discordapp.com/attachments/1092108332812210319/1092109765930405898/Screenshot_5.png")
                                                    .addFields([
                                                        { name: '\`🛒\` | Produto', value: `__${row.name}__`, inline: true },
                                                        { name: '\`📦\` | Quantidade', value: `__${quantity} item(s)__`, inline: true },
                                                        { name: '\`💵\` | Preço', value: `__R$${(row.value * quantity).toFixed(2)}__`, inline: true },
                                                    ])
                                            ],
                                        })
                                    } else if (interaction.customId === "codigo") {
                                        interaction.reply({
                                            content: `📝 | \`${config.sales.banco.ChaveAleatória}\``, ephemeral: true
                                        })



                                        interaction.update({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
            //                                         .setTitle('Sistema de compra')
                                                    .setDescription('Após realizar o pagamento envie o comprovante no canal para que seja analizado sua compra!\n\nRealize o pagamento do(s) produto(s) informações:')
                                                    .setImage("https://cdn.discordapp.com/attachments/1092108332812210319/1092109765930405898/Screenshot_5.png")
                                                    .addFields([
                                                        { name: '\`🛒\` | Produto', value: `__${row.name}__`, inline: true },
                                                        { name: '\`📦\` | Quantidade', value: `__${quantity} item(s)__`, inline: true },
                                                        { name: '\`💵\` | Preço', value: `__R$${(row.value * quantity).toFixed(2)}__`, inline: true },
                                                    ])
                                            ],
                                            components: [
                                                new Discord.ActionRowBuilder()
                                                    .addComponents(
                                                        new Discord.ButtonBuilder()
                                                            .setCustomId(`qrcode_checkout_product1`)
                                                            .setStyle(1)
                                                            .setEmoji('<:qrcode:1086309485376700486> ')
                                                            .setLabel('QR Code')
                                                            .setDisabled(true),
                                                            new Discord.ButtonBuilder()
                                                            .setCustomId(`codigo`)
                                                            .setStyle(1)
                                                            .setEmoji('<:copiar:1098840275142582345>')
                                                            .setLabel('Chave Aleatória')
                                                            .setDisabled(true),
                                                        new Discord.ButtonBuilder()
                                                            .setCustomId(`cancel_checkout`)
                                                            .setStyle(4)
                                                            .setEmoji('<a:errado1:1050469730005299270>')
                                                            .setLabel('Fechar Carrinho'),
                                                        new Discord.ButtonBuilder()
                                                            .setCustomId(`confirm_payment_checkout`)
                                                            .setStyle(3)
                                                            .setEmoji('<a:certo1:1050469700250910730>')
                                                            .setLabel('Confirmar'),
                                                    ),
                                            ]
                                        })
                                    } else if (interaction.customId === "cancel_checkout") {
                                        interaction.channel.delete().then(() => {
                                            interaction.user.send({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setColor(config.client.embed)
                                                        .setTitle('Pedido cancelado')
                                                        .setDescription(`Olá ${interaction.user}, Você cancelou a compra e o stock foi devolvido, volte a comprar quando quiser.`)
                                                        
                                                ]
                                            })
                                        })
                                    } else if (interaction.customId === "confirm_payment_checkout") {
                                        if (!interaction.member.roles.cache.get(config.sales.role_permission_approved)) return interaction.reply({ content: `Você não tem permissão de aprovar a compra!`, ephemeral: true })

                                        if (row.stocks.length < quantity) return interaction.channel.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(interaction2.guild.name + ' | Compra aprovada')
                                                    .setDescription(`Infelizmente alguem comprou esse produto antes de você, mande mensagem para algum dos staffs e apresente o codigo: \`\`\`[${payment.body.id}]\`\`\``)
                                            ]
                                        })

                                            setTimeout(() => msg.delete(),10)
                                            interaction.channel.send({ content: `**✅ | Compra Confirmada**`, embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(`🥂 Compra aprovada 🥂`)
                                                    .setDescription(`${interaction.user} **Compra aprovada com sucesso verifique sua Dm**`)
                                                    .setImage("https://cdn.discordapp.com/attachments/1098832964516851713/1099045191131865110/standard.gif")
                                            ]})
                                          

                                        const stocks = row.stocks.slice(0, quantity);
                                        db.pull(`product_${row.id}.stocks`, stocks)

                                        const owner_id = interaction.channel.name.replace('carrinho-', '');
                                        const user = await interaction.guild.members.fetch(owner_id);

                                        if (!user.roles.cache.get(config.sales.role_customer)) user.roles.add(config.sales.role_customer);

                                        user.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(`🥂 Compra aprovada 🥂`)
                                                    .setImage("https://cdn.discordapp.com/attachments/1098832964516851713/1099045191131865110/standard.gif")
                                                    .setDescription(`
                                                         \`🪐\` | **Seu Produto(s):**
                                                         ${stocks.join('\n')}
                                                         \`🆔\` | **ID da compra:** 
                                                         ${protocol}
                                                `)
                                                .setFooter({ text: `Agradecemos a sua preferência!` })
                                            ]
                                        })

                                        const channel = interaction.guild.channels.cache.get(config.sales.channel_sales);
                                        channel.send({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setColor(config.client.embed)
                                                    .setTitle(interaction.guild.name + ' | Venda aprovada')
                                                    .setDescription(`🥂 **Nova compra aprovada!** 🥂`)
                                                    .setImage("https://cdn.discordapp.com/attachments/1098832964516851713/1099045191131865110/standard.gif")
                                                    .addFields([
                                                        { name: `\`👦🏻\` | Cliente`, value: `${user.user.tag}` },
                                                        { name: `\`🛒\` | Produto:`, value: `${row.name}` },
                                                        { name: `\`💵\` | Valor:`, value: `R$${product_price.toFixed(2)}` },
                                                        { name: `\`🔢\` | Quantidade:`, value: `${quantity}` },
                                                        { name: '\`📅\` | Data da compra:', value: `${moment().format('LLLL')}` }
                                                    ])
                                            ]
                                            
                                        })
                                        
                                        setTimeout(() => interaction.channel.delete(), 50000)
                                        dbJson.add("pedidostotal", 1)
                                        dbJson.add("gastostotal", product_price)
                                        dbJson.add(`${moment().utc().tz('America/Sao_Paulo').format('D/M/Y')}.pedidos`, 1)
                                        dbJson.add(`${moment().utc().tz('America/Sao_Paulo').format('D/M/Y')}.compras`, product_price)
                                        dbJson.add(`${interaction2.user.id}.compras`, product_price)
                                        dbJson.add(`${interaction2.user.id}.pedidos`, 1)
                                    }
                                })
                            })
                        }
                    })
                })
            })
        }
    }
}