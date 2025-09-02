// Calculadora de Custo de Importação
// Autor: Assistente AI
// Descrição: Calcula custos de importação incluindo frete, II e ICMS

class CalculadoraImportacao {
    constructor() {
        this.produtos = [];
        this.proximoId = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.adicionarExemplos();
        this.calcular();
    }

    setupEventListeners() {
        // Botão adicionar produto
        document.getElementById('adicionar-produto').addEventListener('click', () => {
            this.adicionarProduto();
        });

        // Campos de configuração
        document.getElementById('aliquota-icms').addEventListener('input', () => {
            this.calcular();
        });

        document.getElementById('taxa-cambio').addEventListener('input', () => {
            this.calcular();
        });
    }

    // Adiciona exemplos pré-preenchidos conforme solicitado
    adicionarExemplos() {
        // Produto 1: ¥ 177,00 (equivale a R$ 150,00 na cotação atual), quantidade 2, peso 200g
        this.adicionarProduto('¥ 177,00', 2, 200);
        
        // Produto 2: ¥ 94,40 (equivale a R$ 80,00 na cotação atual), quantidade 1, peso 150g
        this.adicionarProduto('¥ 94,40', 1, 150);
        
        // Configurar taxa de câmbio atual (1 real = 1,18 yuans, então 1 yuan = 1/1,18 = 0.847 reais)
        document.getElementById('taxa-cambio').value = '0.847';
    }

    adicionarProduto(precoInicial = '', quantidadeInicial = 1, pesoInicial = 100) {
        const produto = {
            id: this.proximoId++,
            preco: precoInicial,
            quantidade: quantidadeInicial,
            peso: pesoInicial
        };

        this.produtos.push(produto);
        this.renderizarTabela();
        this.calcular();
    }

    removerProduto(id) {
        this.produtos = this.produtos.filter(p => p.id !== id);
        this.renderizarTabela();
        this.calcular();
    }

    renderizarTabela() {
        const tbody = document.getElementById('produtos-tbody');
        tbody.innerHTML = '';

        this.produtos.forEach(produto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="text" 
                           value="${produto.preco}" 
                           placeholder="Ex: ¥ 118,00"
                           data-id="${produto.id}" 
                           data-field="preco"
                           class="produto-input">
                </td>
                <td>
                    <input type="number" 
                           value="${produto.quantidade}" 
                           min="1" 
                           step="1"
                           data-id="${produto.id}" 
                           data-field="quantidade"
                           class="produto-input">
                </td>
                <td>
                    <input type="number" 
                           value="${produto.peso}" 
                           min="1" 
                           step="1"
                           placeholder="Gramas"
                           data-id="${produto.id}" 
                           data-field="peso"
                           class="produto-input">
                </td>
                <td>
                    <button type="button" 
                            class="btn btn-danger" 
                            onclick="calculadora.removerProduto(${produto.id})">
                        Remover
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Adicionar event listeners aos inputs
        document.querySelectorAll('.produto-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.atualizarProduto(e.target);
            });
        });
    }

    atualizarProduto(input) {
        const id = parseInt(input.dataset.id);
        const field = input.dataset.field;
        const value = input.value;

        const produto = this.produtos.find(p => p.id === id);
        if (produto) {
            if (field === 'quantidade' || field === 'peso') {
                produto[field] = parseFloat(value) || 0;
                // Validação
                if (produto[field] <= 0) {
                    input.classList.add('input-error');
                } else {
                    input.classList.remove('input-error');
                }
            } else {
                produto[field] = value;
            }
            this.calcular();
        }
    }

    // Extrai valor numérico de string monetária
    extrairValorNumerico(valorString) {
        if (!valorString) return 0;
        // Remove símbolos monetários e converte vírgulas em pontos
        const numero = valorString.replace(/[^0-9.,]/g, '').replace(',', '.');
        return parseFloat(numero) || 0;
    }

    // Calcula subtotal dos produtos
    calcularSubtotalProdutos() {
        let subtotal = 0;
        let moedaDetectada = '';

        this.produtos.forEach(produto => {
            const preco = this.extrairValorNumerico(produto.preco);
            const quantidade = produto.quantidade || 0;
            subtotal += preco * quantidade;

            // Detecta a moeda do primeiro produto
            if (!moedaDetectada && produto.preco) {
                const match = produto.preco.match(/[^0-9.,\s]+/);
                if (match) {
                    moedaDetectada = match[0];
                }
            }
        });

        return { subtotal, moeda: moedaDetectada || '¥' };
    }

    // Calcula frete baseado no peso total
    calcularFrete() {
        const pesoTotal = this.produtos.reduce((total, produto) => {
            return total + (produto.peso || 0);
        }, 0);

        if (pesoTotal <= 0) return { frete: 0, blocos: 0, pesoTotal };

        // Fórmula do frete:
        // blocos = ceil(peso_em_gramas / 100)
        // se blocos <= 1: frete = 50
        // se blocos > 1: frete = 50 + (blocos - 1) * 11
        const blocos = Math.ceil(pesoTotal / 100);
        let frete;

        if (blocos <= 1) {
            frete = 50;
        } else {
            frete = 50 + (blocos - 1) * 11;
        }

        return { frete, blocos, pesoTotal };
    }

    // Converte frete de ienes para moeda dos produtos
    converterFrete(freteIenes, taxaCambio) {
        if (!taxaCambio || taxaCambio <= 0) {
            return 0;
        }
        return freteIenes * taxaCambio;
    }

    // Calcula Imposto de Importação (60%)
    calcularII(subtotalProdutos, freteConvertido) {
        return 0.60 * (subtotalProdutos + freteConvertido);
    }

    // Calcula ICMS
    calcularICMS(subtotalProdutos, freteConvertido, ii, aliquotaICMS) {
        const baseICMS = subtotalProdutos + freteConvertido + ii;
        return (aliquotaICMS / 100) * baseICMS;
    }

    // Validações
    validarEntradas() {
        let valido = true;
        const aliquotaICMS = parseFloat(document.getElementById('aliquota-icms').value);

        // Validar alíquota ICMS
        if (aliquotaICMS < 0 || aliquotaICMS > 100) {
            document.getElementById('aliquota-icms').classList.add('input-error');
            valido = false;
        } else {
            document.getElementById('aliquota-icms').classList.remove('input-error');
        }

        // Validar produtos
        this.produtos.forEach(produto => {
            if (produto.quantidade <= 0 || produto.peso <= 0) {
                valido = false;
            }
        });

        return valido;
    }

    // Formatar valor monetário
    formatarMoeda(valor, moeda = 'R$') {
        if (valor === 0) return `${moeda} 0,00`;
        return `${moeda} ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Função principal de cálculo
    calcular() {
        if (!this.validarEntradas()) {
            return;
        }

        // 1. Subtotal dos produtos
        const { subtotal: subtotalProdutos, moeda } = this.calcularSubtotalProdutos();

        // 2. Frete em ienes
        const { frete: freteIenes, blocos, pesoTotal } = this.calcularFrete();

        // 3. Taxa de câmbio e frete convertido
        const taxaCambio = parseFloat(document.getElementById('taxa-cambio').value) || 0;
        const freteConvertido = this.converterFrete(freteIenes, taxaCambio);

        // 4. Imposto de Importação (60%)
        const ii = this.calcularII(subtotalProdutos, freteConvertido);

        // 5. ICMS
        const aliquotaICMS = parseFloat(document.getElementById('aliquota-icms').value) || 18;
        const icms = this.calcularICMS(subtotalProdutos, freteConvertido, ii, aliquotaICMS);

        // 6. Total de importação
        const totalImportacao = subtotalProdutos + freteConvertido + ii + icms;

        // 7. Total de unidades e custo médio
        const totalUnidades = this.produtos.reduce((total, produto) => {
            return total + (produto.quantidade || 0);
        }, 0);

        const custoMedio = totalUnidades > 0 ? totalImportacao / totalUnidades : 0;

        // Atualizar interface
        this.atualizarResultados({
            subtotalProdutos,
            freteIenes,
            freteConvertido,
            ii,
            icms,
            totalImportacao,
            totalUnidades,
            custoMedio,
            moeda,
            aliquotaICMS,
            taxaCambio,
            blocos,
            pesoTotal
        });
    }

    atualizarResultados(dados) {
        // Calcular valores em yuan (convertendo de reais quando necessário)
        const subtotalYuan = dados.subtotalProdutos;
        const subtotalReal = dados.taxaCambio > 0 ? dados.subtotalProdutos * dados.taxaCambio : 0;
        
        const iiYuan = dados.taxaCambio > 0 ? dados.ii / dados.taxaCambio : 0;
        const iiReal = dados.ii;
        
        const icmsYuan = dados.taxaCambio > 0 ? dados.icms / dados.taxaCambio : 0;
        const icmsReal = dados.icms;
        
        const totalYuan = dados.taxaCambio > 0 ? dados.totalImportacao / dados.taxaCambio : 0;
        const totalReal = dados.totalImportacao;
        
        const custoMedioYuan = dados.totalUnidades > 0 && dados.taxaCambio > 0 ? totalYuan / dados.totalUnidades : 0;
        const custoMedioReal = dados.totalUnidades > 0 ? totalReal / dados.totalUnidades : 0;
        
        // Atualizar valores na interface - Subtotal
        document.getElementById('subtotal-produtos-yuan').textContent = 
            this.formatarMoeda(subtotalYuan, '¥');
        document.getElementById('subtotal-produtos-real').textContent = 
            this.formatarMoeda(subtotalReal, 'R$');
        
        // Frete (sempre em yuan)
        document.getElementById('frete-ienes').textContent = 
            this.formatarMoeda(dados.freteIenes, '¥');
        
        // Imposto de Importação
        document.getElementById('imposto-importacao-yuan').textContent = 
            this.formatarMoeda(iiYuan, '¥');
        document.getElementById('imposto-importacao-real').textContent = 
            this.formatarMoeda(iiReal, 'R$');
        
        // ICMS
        document.getElementById('icms-yuan').textContent = 
            this.formatarMoeda(icmsYuan, '¥');
        document.getElementById('icms-real').textContent = 
            this.formatarMoeda(icmsReal, 'R$');
        
        // Total de Importação
        document.getElementById('total-importacao-yuan').textContent = 
            this.formatarMoeda(totalYuan, '¥');
        document.getElementById('total-importacao-real').textContent = 
            this.formatarMoeda(totalReal, 'R$');
        
        // Total de unidades
        document.getElementById('total-unidades').textContent = 
            dados.totalUnidades.toString();
        
        // Custo médio por unidade
        document.getElementById('custo-medio-yuan').textContent = 
            this.formatarMoeda(custoMedioYuan, '¥');
        document.getElementById('custo-medio-real').textContent = 
            this.formatarMoeda(custoMedioReal, 'R$');

        // Mostrar/ocultar aviso de câmbio
        const avisoCambio = document.getElementById('aviso-cambio');
        if (!dados.taxaCambio || dados.taxaCambio <= 0) {
            avisoCambio.style.display = 'block';
        } else {
            avisoCambio.style.display = 'none';
        }

        // Atualizar detalhamento
        this.atualizarDetalhamento(dados);
    }

    atualizarDetalhamento(dados) {
        const detalhamento = document.getElementById('detalhamento');
        
        let texto = `DETALHAMENTO DOS CÁLCULOS\n`;
        texto += `================================\n\n`;
        
        texto += `1. PRODUTOS:\n`;
        this.produtos.forEach((produto, index) => {
            const preco = this.extrairValorNumerico(produto.preco);
            const subtotalProduto = preco * produto.quantidade;
            texto += `   Produto ${index + 1}: ${produto.preco} × ${produto.quantidade} = ${this.formatarMoeda(subtotalProduto, '¥')}\n`;
        });
        const subtotalReal = dados.taxaCambio > 0 ? dados.subtotalProdutos * dados.taxaCambio : 0;
        texto += `   Subtotal: ${this.formatarMoeda(dados.subtotalProdutos, '¥')}`;
        if (dados.taxaCambio > 0) {
            texto += ` = ${this.formatarMoeda(subtotalReal, 'R$')}`;
        }
        texto += `\n\n`;
        
        texto += `2. FRETE:\n`;
        texto += `   Peso total: ${dados.pesoTotal}g\n`;
        texto += `   Blocos de 100g: ${dados.blocos} blocos\n`;
        if (dados.blocos <= 1) {
            texto += `   Cálculo: Primeiros 100g = ¥50,00\n`;
        } else {
            texto += `   Cálculo: ¥50,00 + (${dados.blocos - 1} × ¥11,00) = ¥${dados.freteIenes.toFixed(2)}\n`;
        }
        texto += `   Frete em ¥: ${this.formatarMoeda(dados.freteIenes, '¥')}\n`;
        
        if (dados.taxaCambio > 0) {
            texto += `   Taxa de câmbio: ${dados.taxaCambio} (cotação: R$ 1,00 = ¥ 1,18)\n`;
            texto += `   Frete convertido: ¥${dados.freteIenes.toFixed(2)} × ${dados.taxaCambio} = ${this.formatarMoeda(dados.freteConvertido, dados.moeda)}\n\n`;
        } else {
            texto += `   ⚠️ Taxa de câmbio não informada\n\n`;
        }
        
        texto += `3. IMPOSTO DE IMPORTAÇÃO (60%):\n`;
        const baseII = dados.subtotalProdutos + dados.freteIenes;
        const baseIIReal = dados.taxaCambio > 0 ? baseII * dados.taxaCambio : 0;
        texto += `   Base: ${this.formatarMoeda(dados.subtotalProdutos, '¥')} + ${this.formatarMoeda(dados.freteIenes, '¥')} = ${this.formatarMoeda(baseII, '¥')}`;
        if (dados.taxaCambio > 0) {
            texto += ` = ${this.formatarMoeda(baseIIReal, 'R$')}`;
        }
        texto += `\n`;
        const iiYuan = dados.taxaCambio > 0 ? dados.ii / dados.taxaCambio : 0;
        texto += `   II: ${this.formatarMoeda(baseIIReal, 'R$')} × 60% = ${this.formatarMoeda(dados.ii, 'R$')}`;
        if (dados.taxaCambio > 0) {
            texto += ` = ${this.formatarMoeda(iiYuan, '¥')}`;
        }
        texto += `\n\n`;
        
        texto += `4. ICMS (${dados.aliquotaICMS}%):\n`;
        const baseICMS = dados.subtotalProdutos + dados.freteConvertido + dados.ii;
        const baseICMSYuan = dados.taxaCambio > 0 ? baseICMS / dados.taxaCambio : 0;
        texto += `   Base: ${this.formatarMoeda(baseICMS, 'R$')}`;
        if (dados.taxaCambio > 0) {
            texto += ` = ${this.formatarMoeda(baseICMSYuan, '¥')}`;
        }
        texto += `\n`;
        const icmsYuan = dados.taxaCambio > 0 ? dados.icms / dados.taxaCambio : 0;
        texto += `   ICMS: ${this.formatarMoeda(baseICMS, 'R$')} × ${dados.aliquotaICMS}% = ${this.formatarMoeda(dados.icms, 'R$')}`;
        if (dados.taxaCambio > 0) {
            texto += ` = ${this.formatarMoeda(icmsYuan, '¥')}`;
        }
        texto += `\n\n`;
        
        texto += `5. TOTAL:\n`;
        const totalYuan = dados.taxaCambio > 0 ? dados.totalImportacao / dados.taxaCambio : 0;
        texto += `   Total em R$: ${this.formatarMoeda(dados.totalImportacao, 'R$')}`;
        if (dados.taxaCambio > 0) {
            texto += `\n   Total em ¥: ${this.formatarMoeda(totalYuan, '¥')}`;
        }
        texto += `\n\n`;
        
        texto += `6. CUSTO POR UNIDADE:\n`;
        const custoMedioYuan = dados.totalUnidades > 0 && dados.taxaCambio > 0 ? totalYuan / dados.totalUnidades : 0;
        const custoMedioReal = dados.totalUnidades > 0 ? dados.totalImportacao / dados.totalUnidades : 0;
        texto += `   Custo médio em R$: ${this.formatarMoeda(custoMedioReal, 'R$')} por unidade`;
        if (dados.taxaCambio > 0) {
            texto += `\n   Custo médio em ¥: ${this.formatarMoeda(custoMedioYuan, '¥')} por unidade`;
        }
        
        detalhamento.textContent = texto;
    }
}

// Inicializar calculadora quando a página carregar
let calculadora;
document.addEventListener('DOMContentLoaded', () => {
    calculadora = new CalculadoraImportacao();
});