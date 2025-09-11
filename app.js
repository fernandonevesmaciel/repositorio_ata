import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAN_UVg8c9Cdcvok9-WHXJiZYnOdcmpMjI",
    authDomain: "repositoriomacanica.firebaseapp.com",
    projectId: "repositoriomacanica",
    storageBucket: "repositoriomacanica.firebasestorage.app",
    messagingSenderId: "10549769581",
    appId: "1:10549769581:web:80cbf33ee9d3af31ac9664",
    measurementId: "G-JLTGTXC8MD"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Lógica para a página de login (login.html)
if (document.getElementById('form-login')) {
    const formLogin = document.getElementById('form-login');
    const mensagemLogin = document.getElementById('mensagem-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = formLogin.elements.email.value;
        const senha = formLogin.elements.senha.value;

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            window.location.href = 'admin.html';
        } catch (error) {
            console.error("Erro no login: ", error);
            let mensagemDeErro = "Ocorreu um erro. Por favor, tente novamente.";

            switch (error.code) {
                case 'auth/invalid-email':
                    mensagemDeErro = "E-mail inválido. Por favor, verifique o formato.";
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    mensagemDeErro = "E-mail ou senha incorretos.";
                    break;
                case 'auth/too-many-requests':
                    mensagemDeErro = "Acesso bloqueado temporariamente por muitas tentativas falhas. Tente novamente mais tarde.";
                    break;
                default:
                    break;
            }
            mensagemLogin.textContent = mensagemDeErro;
        }
    });
}

// Lógica para a página de registro de serviço (index.html)
if (document.getElementById('form-servico')) {
    const formServico = document.getElementById('form-servico');
    const btnRegistrar = document.getElementById('btn-registrar');
    const btnEnviarTodos = document.getElementById('btn-enviar-todos');
    const tabelaCorpoPendentes = document.getElementById('tabela-corpo-pendentes');
    const mensagem = document.getElementById('mensagem');
    const tabelaContainerPendentes = document.getElementById('tabela-servicos-pendentes');

    let servicosPendentes = [];

    // Função para carregar serviços do localStorage
    function carregarServicosDoLocalStorage() {
        const servicosSalvos = localStorage.getItem('servicosPendentes');
        if (servicosSalvos) {
            servicosPendentes = JSON.parse(servicosSalvos);
        }
    }

    // Função para salvar serviços no localStorage
    function salvarServicosNoLocalStorage() {
        localStorage.setItem('servicosPendentes', JSON.stringify(servicosPendentes));
    }

    // Função para atualizar a tabela na tela
    function atualizarTabelaPendentes() {
        tabelaCorpoPendentes.innerHTML = ''; // Limpa a tabela
        if (servicosPendentes.length > 0) {
            tabelaContainerPendentes.style.display = 'block';
            servicosPendentes.forEach((servico, index) => {
                const row = tabelaCorpoPendentes.insertRow();
                row.insertCell(0).textContent = servico.nomesFuncionarios.join(', ');

                const dataOriginal = new Date(servico.dia + 'T00:00:00'); // Cria um objeto Date
                const dataFormatada = dataOriginal.toLocaleDateString('pt-BR'); // Formata a data para DD/MM/AAAA
                row.insertCell(1).textContent = dataFormatada;

                row.insertCell(2).textContent = servico.horaInicio;
                row.insertCell(3).textContent = servico.horaTermino;
                row.insertCell(4).textContent = servico.nomeServico;
                row.insertCell(5).textContent = servico.tipoServico;
                row.insertCell(6).textContent = servico.turno;

                const celulaAcoes = row.insertCell(7);
                const btnEditar = document.createElement('button');
                btnEditar.textContent = 'Editar';
                btnEditar.classList.add('btn-editar');
                btnEditar.setAttribute('data-index', index);
                celulaAcoes.appendChild(btnEditar);
            });
            btnEnviarTodos.style.display = 'block';
        } else {
            tabelaContainerPendentes.style.display = 'none';
            btnEnviarTodos.style.display = 'none';
        }
    }

    // Lógica para o botão de edição
    tabelaCorpoPendentes.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-editar')) {
            const index = e.target.getAttribute('data-index');
            const servicoParaEditar = servicosPendentes[index];

            formServico.elements.funcionario1.value = servicoParaEditar.nomesFuncionarios[0] || '';
            formServico.elements.funcionario2.value = servicoParaEditar.nomesFuncionarios[1] || '';
            formServico.elements.funcionario3.value = servicoParaEditar.nomesFuncionarios[2] || '';
            formServico.elements.funcionario4.value = servicoParaEditar.nomesFuncionarios[3] || '';
            formServico.elements.dia.value = servicoParaEditar.dia;
            formServico.elements.horaInicio.value = servicoParaEditar.horaInicio;
            formServico.elements.horaTermino.value = servicoParaEditar.horaTermino;
            formServico.elements.nomeServico.value = servicoParaEditar.nomeServico;
            formServico.elements.tipoServico.value = servicoParaEditar.tipoServico;
            formServico.elements.turno.value = servicoParaEditar.turno;

            servicosPendentes.splice(index, 1);
            salvarServicosNoLocalStorage();
            atualizarTabelaPendentes();

            mensagem.textContent = "Serviço carregado no formulário para edição.";
        }
    });

    // Evento para o botão 'Registrar Serviço na Lista'
    // Evento para o botão 'Registrar Serviço na Lista'
    btnRegistrar.addEventListener('click', (e) => {
        e.preventDefault();

        if (!formServico.checkValidity()) {
            formServico.reportValidity();
            return;
        }

        const nome1 = formServico.elements.funcionario1.value;
        const nome2 = formServico.elements.funcionario2.value;
        const nome3 = formServico.elements.funcionario3.value;
        const nome4 = formServico.elements.funcionario4.value;

        const nomesArray = [nome1, nome2, nome3, nome4].filter(nome => nome !== '');

        if (nomesArray.length === 0) {
            mensagem.textContent = "Selecione pelo menos um funcionário.";
            return;
        }

        const horaInicio = formServico.elements.horaInicio.value;
        const horaTermino = formServico.elements.horaTermino.value;
        const turnoSelecionado = formServico.elements.turno.value;

        const [hInicio, mInicio] = horaInicio.split(':').map(Number);
        const [hTermino, mTermino] = horaTermino.split(':').map(Number);

        const totalMinutosInicio = hInicio * 60 + mInicio;
        const totalMinutosTermino = hTermino * 60 + mTermino;

        // A validação agora tem uma exceção para o 3º Turno
        if (totalMinutosInicio >= totalMinutosTermino && turnoSelecionado !== '3 turno') {
            alert("Atenção: A hora de início não pode ser maior ou igual à hora de término. Por favor, corrija.");
            return;
        }

        const novoServico = {
            nomesFuncionarios: nomesArray,
            dia: formServico.elements.dia.value,
            horaInicio: formServico.elements.horaInicio.value,
            horaTermino: formServico.elements.horaTermino.value,
            nomeServico: formServico.elements.nomeServico.value,
            tipoServico: formServico.elements.tipoServico.value,
            turno: turnoSelecionado
        };

        servicosPendentes.push(novoServico);
        mensagem.textContent = "Serviço adicionado à lista!";
        formServico.reset();
        salvarServicosNoLocalStorage();
        atualizarTabelaPendentes();
    });
    // Evento para o botão 'Enviar Todos para o Banco de Dados'
    btnEnviarTodos.addEventListener('click', async () => {
        if (servicosPendentes.length === 0) {
            mensagem.textContent = "Não há serviços na lista para enviar.";
            return;
        }

        try {
            for (const servico of servicosPendentes) {
                for (const nome of servico.nomesFuncionarios) {
                    await addDoc(collection(db, "servicos"), {
                        nomeFuncionario: nome,
                        dia: servico.dia,
                        horaInicio: servico.horaInicio,
                        horaTermino: servico.horaTermino,
                        nomeServico: servico.nomeServico,
                        tipoServico: servico.tipoServico,
                        turno: servico.turno,
                        dataRegistro: new Date(servico.dia.replace(/-/g, '\/'))
                    });
                }
            }

            mensagem.textContent = "Todos os serviços foram registrados com sucesso!";
            servicosPendentes = [];
            localStorage.removeItem('servicosPendentes');
            atualizarTabelaPendentes();
        } catch (error) {
            console.error("Erro ao adicionar documentos: ", error);
            mensagem.textContent = "Erro ao registrar serviços. Verifique o console para mais detalhes.";
        }
    });

    carregarServicosDoLocalStorage();
    atualizarTabelaPendentes();
}

// Lógica para o painel do administrador (admin.html)
if (document.getElementById('tabela-servicos')) {

    const tabelaCorpo = document.getElementById('tabela-servicos').getElementsByTagName('tbody')[0];
    const formFiltros = document.getElementById('form-filtros');
    const btnLimpar = document.getElementById('limparFiltros');
    const filtroSelecao = document.getElementById('filtro-selecao');
    const containersFiltro = {
        funcionario: document.getElementById('containerFuncionario'),
        tipoServico: document.getElementById('containerTipoServico'),
        turno: document.getElementById('containerTurno'),
        data: document.getElementById('containerData')
    };
    const tabelaContainer = document.querySelector('.tabela-container');
    const toggleBtn = document.getElementById('toggle-horas-btn');
    const visualizadorHoras = document.getElementById('visualizador-horas');
    const containerHorasDisponiveis = document.getElementById('container-horas-disponiveis');

    // Novos elementos do modal
    const exportarPDFBtn = document.getElementById('exportar-pdf');
    const modalContainer = document.getElementById('modal-container');
    const modalFiltroData = document.getElementById('modal-filtro-data');
    const modalExportarBtn = document.getElementById('modal-exportar-btn');
    const modalCancelarBtn = document.getElementById('modal-cancelar-btn');

    // Novos elementos de filtro de horas
    const filtroMesInput = document.getElementById('filtro-mes');
    const aplicarFiltroMesBtn = document.getElementById('aplicar-filtro-mes-btn');
    const jornadaDiariaEmMinutos = 440; // 7h20m convertidos para minutos

    // Nova estrutura de dados para horas disponíveis por funcionário
    const horasDisponiveisPorFuncionario = {
        "Valdinei": 440,
        "Wanner": 440,
        "Sandro": 440,
        "Victor": 440,
        "Ericky": 440,
        "Endrew": 440,
        "André Bacceto": 440,
        "Guilherme": 440,
        "Abib": 440,
        "Diogo": 440,
        "Luiz Felipe": 440,
        "Fabiano": 440,
        "Leigmar": 440,
        "Vitor Reis": 440,
        "Gabriel": 440,
        "Allison": 440
    };

    // ======================================================================================
    // FUNÇÕES GLOBAIS DENTRO DO ESCOPO DE ADMIN.HTML
    // Mover as funções de carregamento para o topo para evitar o ReferenceError
    // ======================================================================================

    // Função para calcular a diferença de tempo em minutos
    function calcularDiferencaEmMinutos(horaInicio, horaTermino) {
        const [hInicio, mInicio] = horaInicio.split(':').map(Number);
        const [hTermino, mTermino] = horaTermino.split(':').map(Number);

        const totalMinutosInicio = hInicio * 60 + mInicio;
        let totalMinutosTermino = hTermino * 60 + mTermino;

        // Se a hora de término for menor que a hora de início,
        // significa que o serviço terminou no dia seguinte.
        // Adicionamos 24 horas (1440 minutos) à hora de término para o cálculo.
        if (totalMinutosTermino < totalMinutosInicio) {
            totalMinutosTermino += 1440;
        }

        return totalMinutosTermino - totalMinutosInicio;
    }

    // Função para formatar minutos em HH:MM
    function formatarMinutosParaHoras(minutos) {
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // NOVA FUNÇÃO para exibir a tabela de horas por funcionário
    async function exibirHorasPorFuncionario(mesSelecionado) {
        if (!containerHorasDisponiveis) {
            console.error("Elemento 'container-horas-disponiveis' não encontrado.");
            return;
        }

        const [ano, mes] = mesSelecionado.split('-').map(Number);
        const dataInicioMes = new Date(ano, mes - 1, 1);
        const dataFimMes = new Date(ano, mes, 1);

        const servicosRef = collection(db, "servicos");
        const q = query(
            servicosRef,
            where("dataRegistro", ">=", dataInicioMes),
            where("dataRegistro", "<", dataFimMes)
        );

        const querySnapshot = await getDocs(q);
        const horasTrabalhadasPorFuncionario = {};
        const diasTrabalhadosPorFuncionario = {};

        // INICIALIZAÇÃO DAS VARIÁVEIS DE TOTAIS
        let totalHorasDisponiveisMinutos = 0;
        let totalHorasTrabalhadasMinutos = 0;
        let funcionariosComDados = 0;

        // Inicializa contadores
        for (const funcionario in horasDisponiveisPorFuncionario) {
            horasTrabalhadasPorFuncionario[funcionario] = 0;
            diasTrabalhadosPorFuncionario[funcionario] = new Set();
        }

        // Soma as horas trabalhadas e conta os dias únicos
        querySnapshot.forEach(doc => {
            const dados = doc.data();
            const { nomeFuncionario, horaInicio, horaTermino, dataRegistro } = dados;

            if (horasDisponiveisPorFuncionario.hasOwnProperty(nomeFuncionario)) {
                const minutosTrabalhados = calcularDiferencaEmMinutos(horaInicio, horaTermino);
                horasTrabalhadasPorFuncionario[nomeFuncionario] += minutosTrabalhados;
                const dataString = dataRegistro.toDate().toISOString().split('T')[0];
                diasTrabalhadosPorFuncionario[nomeFuncionario].add(dataString);
            }
        });

        // Gera o HTML da tabela
        let tabelaHTML = `
        <h2>Horas por Funcionário</h2>
        <table class="tabela-contagem">
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Horas Disponíveis</th>
                    <th>Horas Trabalhadas</th>
                    <th>Aproveitamento</th>
                    <th>Dias Trabalhados</th>
                </tr>
            </thead>
            <tbody>
    `;

        const funcionarios = Object.keys(horasDisponiveisPorFuncionario);

        if (funcionarios.length === 0) {
            tabelaHTML += `<tr><td colspan="5">Nenhum funcionário cadastrado ou dados para o período.</td></tr>`;
        } else {
            for (const funcionario of funcionarios) {
                const diasTrabalhados = diasTrabalhadosPorFuncionario[funcionario].size;
                const horasDisponiveisEmMinutos = diasTrabalhados * jornadaDiariaEmMinutos;
                const horasTrabalhadasEmMinutos = horasTrabalhadasPorFuncionario[funcionario];

                let aproveitamento = 0;
                let corClasse = '';

                if (horasDisponiveisEmMinutos > 0) {
                    aproveitamento = (horasTrabalhadasEmMinutos / horasDisponiveisEmMinutos) * 100;
                    if (aproveitamento > 100) {
                        corClasse = 'red-text';
                    } else if (aproveitamento < 50) {
                        corClasse = 'yellow-text';
                    }
                }

                // Acumula os totais para o cálculo do aproveitamento da equipe
                if (diasTrabalhados > 0) {
                    totalHorasDisponiveisMinutos += horasDisponiveisEmMinutos;
                    totalHorasTrabalhadasMinutos += horasTrabalhadasEmMinutos;
                    funcionariosComDados++;
                }

                tabelaHTML += `
                <tr>
                    <td>${funcionario}</td>
                    <td>${formatarMinutosParaHoras(horasDisponiveisEmMinutos)}</td>
                    <td>${formatarMinutosParaHoras(horasTrabalhadasEmMinutos)}</td>
                    <td class="${corClasse}">${aproveitamento.toFixed(2)}%</td>
                    <td>${diasTrabalhados}</td>
                </tr>
            `;
            }

            // ====================================================================
            // NOVO CÁLCULO DE APROVEITAMENTO DA EQUIPE
            // ====================================================================
            let aproveitamentoTotalEquipe = 0;
            if (totalHorasDisponiveisMinutos > 0) {
                aproveitamentoTotalEquipe = (totalHorasTrabalhadasMinutos / totalHorasDisponiveisMinutos) * 100;
            }

            let corTotalAproveitamento = '';
            if (aproveitamentoTotalEquipe < 80 || aproveitamentoTotalEquipe > 99) {
                corTotalAproveitamento = 'red-text';
            }

            tabelaHTML += `
            <tr class="tabela-totais">
                <td><strong>Total da Equipe</strong></td>
                <td><strong>${formatarMinutosParaHoras(totalHorasDisponiveisMinutos)}</strong></td>
                <td><strong>${formatarMinutosParaHoras(totalHorasTrabalhadasMinutos)}</strong></td>
                <td class="${corTotalAproveitamento}"><strong>${aproveitamentoTotalEquipe.toFixed(2)}%</strong></td>
                <td></td>
            </tr>
        `;
        }

        tabelaHTML += `
            </tbody>
        </table>
    `;

        containerHorasDisponiveis.innerHTML = tabelaHTML;
    }
    // Função para exportar a tabela visível para PDF
     async function exportarParaPDF(mesSelecionado) {
        if (!mesSelecionado) return;

        const [ano, mes] = mesSelecionado.split('-').map(Number);
        const dataInicioMes = new Date(ano, mes - 1, 1);
        const dataFimMes = new Date(ano, mes, 1);

        const q = query(
            collection(db, "servicos"),
            where("dataRegistro", ">=", dataInicioMes),
            where("dataRegistro", "<", dataFimMes),
            orderBy("dataRegistro", "asc")
        );

        const querySnapshot = await getDocs(q);
        const dadosExportar = [];
        querySnapshot.forEach(doc => {
            dadosExportar.push(doc.data());
        });

        if (dadosExportar.length === 0) {
            alert("Nenhum serviço encontrado para o mês selecionado.");
            return;
        }

        const contagemDeServicoHTML = await gerarQuantidadesDeServicoHTML(mesSelecionado);
        const horasPorFuncionarioHTML = await gerarHorasPorFuncionarioPDF(mesSelecionado);

        const tabelaHTML = `
        <style>
            table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                word-wrap: break-word;
            }
            th {
                background-color: #f2f2f2;
            }
            @media print {
                table, tr, td {
                    page-break-inside: avoid;
                }
                .tabela-relatorio {
                    page-break-after: always;
                }
            }
        </style>
        <h1>Relatório de Serviços - Mês: ${mes} / ${ano}</h1>
        <br>
        <div class="tabela-relatorio">
            ${contagemDeServicoHTML}
        </div>
        <div>
            ${horasPorFuncionarioHTML}
        </div>

    `;

        const opt = {
            margin: 1,
            filename: `relatorio-servicos-${mes}-${ano}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
            pagebreak: { mode: 'avoid-all' }
        };

        html2pdf().from(tabelaHTML).set(opt).save();
    }
    // Nova função para gerar a tabela de horas para o PDF
    async function gerarHorasPorFuncionarioPDF(mesSelecionado) {
        const [ano, mes] = mesSelecionado.split('-').map(Number);
        const dataInicioMes = new Date(ano, mes - 1, 1);
        const dataFimMes = new Date(ano, mes, 1);

        const servicosRef = collection(db, "servicos");
        const q = query(
            servicosRef,
            where("dataRegistro", ">=", dataInicioMes),
            where("dataRegistro", "<", dataFimMes)
        );

        const querySnapshot = await getDocs(q);
        const horasTrabalhadasPorFuncionario = {};
        const diasTrabalhadosPorFuncionario = {};

        // INICIALIZAÇÃO DAS VARIÁVEIS DE TOTAIS
        let totalHorasDisponiveisMinutos = 0;
        let totalHorasTrabalhadasMinutos = 0;

        for (const funcionario in horasDisponiveisPorFuncionario) {
            horasTrabalhadasPorFuncionario[funcionario] = 0;
            diasTrabalhadosPorFuncionario[funcionario] = new Set();
        }

        querySnapshot.forEach(doc => {
            const dados = doc.data();
            const { nomeFuncionario, horaInicio, horaTermino, dataRegistro } = dados;

            if (horasDisponiveisPorFuncionario.hasOwnProperty(nomeFuncionario)) {
                const minutosTrabalhados = calcularDiferencaEmMinutos(horaInicio, horaTermino);
                horasTrabalhadasPorFuncionario[nomeFuncionario] += minutosTrabalhados;
                const dataString = dataRegistro.toDate().toISOString().split('T')[0];
                diasTrabalhadosPorFuncionario[nomeFuncionario].add(dataString);
            }
        });

        let tabelaHTML = `
            <h2>Horas por Funcionário</h2>
            <table class="tabela-contagem">
                <thead>
                    <tr>
                        <th>Funcionário</th>
                        <th>Horas Disponíveis</th>
                        <th>Horas Trabalhadas</th>
                        <th>Aproveitamento</th>
                        <th>Dias Trabalhados</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const funcionarios = Object.keys(horasDisponiveisPorFuncionario);

        if (funcionarios.length === 0) {
            tabelaHTML += `<tr><td colspan="5">Nenhum funcionário cadastrado ou dados para o período.</td></tr>`;
        } else {
            for (const funcionario of funcionarios) {
                const diasTrabalhados = diasTrabalhadosPorFuncionario[funcionario].size;
                const horasDisponiveisEmMinutos = diasTrabalhados * jornadaDiariaEmMinutos;
                const horasTrabalhadasEmMinutos = horasTrabalhadasPorFuncionario[funcionario];

                let aproveitamento = 0;
                let corClasse = '';

                if (horasDisponiveisEmMinutos > 0) {
                    aproveitamento = (horasTrabalhadasEmMinutos / horasDisponiveisEmMinutos) * 100;
                    if (aproveitamento > 100) {
                        corClasse = 'red-text';
                    } else if (aproveitamento < 50) {
                        corClasse = 'yellow-text';
                    }
                }

                // Acumula os totais para o cálculo do aproveitamento da equipe
                if (diasTrabalhados > 0) {
                    totalHorasDisponiveisMinutos += horasDisponiveisEmMinutos;
                    totalHorasTrabalhadasMinutos += horasTrabalhadasEmMinutos;
                }

                tabelaHTML += `
                    <tr>
                        <td>${funcionario}</td>
                        <td>${formatarMinutosParaHoras(horasDisponiveisEmMinutos)}</td>
                        <td>${formatarMinutosParaHoras(horasTrabalhadasEmMinutos)}</td>
                        <td class="${corClasse}">${aproveitamento.toFixed(2)}%</td>
                        <td>${diasTrabalhados}</td>
                    </tr>
                `;
            }

            // ====================================================================
            // CÁLCULO DE APROVEITAMENTO DA EQUIPE NO PDF
            // ====================================================================
            let aproveitamentoTotalEquipe = 0;
            if (totalHorasDisponiveisMinutos > 0) {
                aproveitamentoTotalEquipe = (totalHorasTrabalhadasMinutos / totalHorasDisponiveisMinutos) * 100;
            }

            let corTotalAproveitamento = '';
            if (aproveitamentoTotalEquipe < 80 || aproveitamentoTotalEquipe > 99) {
                corTotalAproveitamento = 'red-text';
            }

            tabelaHTML += `
                <tr class="tabela-totais">
                    <td><strong>Total da Equipe</strong></td>
                    <td><strong>${formatarMinutosParaHoras(totalHorasDisponiveisMinutos)}</strong></td>
                    <td><strong>${formatarMinutosParaHoras(totalHorasTrabalhadasMinutos)}</strong></td>
                    <td class="${corTotalAproveitamento}"><strong>${aproveitamentoTotalEquipe.toFixed(2)}%</strong></td>
                    <td></td>
                </tr>
            `;
        }

        tabelaHTML += `
                </tbody>
            </table>
        `;

        return tabelaHTML;
    }

    // NOVA FUNÇÃO para exibir a contagem de serviços por tipo
    async function exibirQuantidadesDeServico(mesSelecionado, inserirNoHtml = false) {
        const quantidadesHTML = await gerarQuantidadesDeServicoHTML(mesSelecionado);
        if (inserirNoHtml) {
            const containerDados = document.getElementById('dados-turnos');
            containerDados.innerHTML = quantidadesHTML;
        }
    }

    // NOVA FUNÇÃO para gerar o HTML da tabela de contagem
    async function gerarQuantidadesDeServicoHTML(mesSelecionado) {
        try {
            if (!mesSelecionado) {
                return `<h2>Quantidade de Serviços por Tipo</h2><p>Selecione um mês para exibir os dados.</p>`;
            }

            const tiposServico = [
                "ajuste/reparo/concerto",
                "emergencial",
                "inspecao/checklist",
                "limpeza_e_organizacao",
                "melhoria",
                "preventiva",
                "programada",
                "qualidade",
                "fabricacao_montagem",
                "lubrificacao"
            ];

            const [ano, mes] = mesSelecionado.split('-').map(Number);
            const dataInicioMes = new Date(ano, mes - 1, 1);
            const dataFimMes = new Date(ano, mes, 1);

            const servicosRef = collection(db, "servicos");
            const q = query(
                servicosRef,
                where("dataRegistro", ">=", dataInicioMes),
                where("dataRegistro", "<", dataFimMes)
            );

            const querySnapshot = await getDocs(q);
            const servicosUnicos = {};

            querySnapshot.forEach(doc => {
                const dados = doc.data();
                const chave = `${dados.turno}-${dados.dia}-${dados.horaInicio}-${dados.horaTermino}`;

                if (!servicosUnicos[chave]) {
                    servicosUnicos[chave] = dados;
                }
            });

            const contagemPorTipo = {};
            tiposServico.forEach(tipo => contagemPorTipo[tipo] = 0);

            for (const chave in servicosUnicos) {
                const servico = servicosUnicos[chave];
                if (contagemPorTipo.hasOwnProperty(servico.tipoServico)) {
                    contagemPorTipo[servico.tipoServico]++;
                }
            }

            let horasHTML = `
                <h2>Quantidade de Serviços por Tipo</h2>
                <table class="tabela-contagem">
                    <thead>
                        <tr>
                            <th>Tipo de Serviço</th>
                            <th>Quantidade</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (Object.keys(servicosUnicos).length === 0) {
                horasHTML += `<tr><td colspan="2">Nenhum serviço encontrado para o período selecionado.</td></tr>`;
            } else {
                for (const tipo of tiposServico) {
                    const quantidade = contagemPorTipo[tipo] || 0;
                    if (quantidade > 0) {
                        horasHTML += `
                            <tr>
                                <td>${tipo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                                <td>${quantidade}</td>
                            </tr>
                        `;
                    }
                }
            }

            horasHTML += `
                        </tbody>
                    </table>
                `;

            return horasHTML;

        } catch (error) {
            console.error("Erro ao gerar HTML para quantidade de serviços: ", error);
            return `<h2>Quantidade de Serviços por Tipo</h2><p>Erro ao carregar os dados.</p>`;
        }
    }

    // Função para carregar dados de serviço da base de dados e criar botões de edição
    async function carregarDadosServicos() {
        try {
            const filtroAtual = filtroSelecao.value;
            let servicosRef = collection(db, "servicos");
            let q;
            let filtrosAplicados = false;

            if (filtroAtual === 'funcionario') {
                const nomeFuncionario = formFiltros.elements.filtroFuncionario.value;
                if (nomeFuncionario) {
                    q = query(servicosRef, where("nomeFuncionario", "==", nomeFuncionario), orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"));
                    filtrosAplicados = true;
                }
            } else if (filtroAtual === 'tipoServico') {
                const tipoServico = formFiltros.elements.filtroTipoServico.value;
                if (tipoServico) {
                    q = query(servicosRef, where("tipoServico", "==", tipoServico), orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"));
                    filtrosAplicados = true;
                }
            } else if (filtroAtual === 'turno') {
                const turno = formFiltros.elements.filtroTurno.value;
                if (turno) {
                    q = query(servicosRef, where("turno", "==", turno), orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"));
                    filtrosAplicados = true;
                }
            } else if (filtroAtual === 'data') {
                const dataFiltro = formFiltros.elements.filtroData.value;
                if (dataFiltro) {
                    const dataSelecionada = new Date(dataFiltro + 'T00:00:00');
                    const proximoDia = new Date(dataSelecionada);
                    proximoDia.setDate(proximoDia.getDate() + 1);
                    q = query(servicosRef, where("dataRegistro", ">=", dataSelecionada), where("dataRegistro", "<", proximoDia), orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"));
                    filtrosAplicados = true;
                }
            }

            // Se nenhum filtro for aplicado ou o filtro estiver vazio, carregue todos os dados.
            if (!filtrosAplicados) {
                q = query(servicosRef, orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"), orderBy("nomeFuncionario", "asc"));
            }

            const querySnapshot = await getDocs(q);
            tabelaCorpo.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const dados = doc.data();
                const row = tabelaCorpo.insertRow();
                row.setAttribute('data-doc-id', doc.id); // Adiciona o ID do documento à linha para referência

                row.insertCell(0).textContent = dados.nomeFuncionario;

                const dataObjeto = dados.dataRegistro.toDate();
                const dataFormatada = dataObjeto.toLocaleDateString('pt-BR');
                row.insertCell(1).textContent = dataFormatada;

                row.insertCell(2).textContent = dados.horaInicio;
                row.insertCell(3).textContent = dados.horaTermino;
                row.insertCell(4).textContent = dados.nomeServico;
                row.insertCell(5).textContent = dados.tipoServico;
                row.insertCell(6).textContent = dados.turno;

                const cellAcoes = row.insertCell(7);
                cellAcoes.classList.add('acoes-celula');

                // Botão Editar
                const btnEditar = document.createElement('button');
                btnEditar.textContent = 'Editar';
                btnEditar.classList.add('btn', 'btn-editar');
                btnEditar.addEventListener('click', () => iniciarEdicao(doc.id, dados, row));
                cellAcoes.appendChild(btnEditar);

                // Botão Excluir
                const btnExcluir = document.createElement('button');
                btnExcluir.textContent = 'Excluir';
                btnExcluir.classList.add('btn', 'btn-excluir');
                btnExcluir.addEventListener('click', () => excluirServico(doc.id));
                cellAcoes.appendChild(btnExcluir);
            });

            if (filtrosAplicados) {
                tabelaContainer.scrollTop = 0;
            } else {
                tabelaContainer.scrollTop = tabelaContainer.scrollHeight;
            }

        } catch (error) {
            console.error("Erro ao carregar dados: ", error);
        }
    }

    // NOVO: Função para iniciar o processo de edição
    // Função para iniciar a edição
    function iniciarEdicao(docId, dados, row) {
        // Encontra a linha da tabela a partir do docId
        const linha = document.querySelector(`tr[data-doc-id="${docId}"]`);
        if (!linha) return;

        // Armazena os dados originais e o ID
        linha.setAttribute('data-doc-id', docId);
        linha.setAttribute('data-original-data', JSON.stringify(dados));

        // Define os campos que são inputs editáveis
        const campos = ['nomeFuncionario', 'dataRegistro', 'horaInicio', 'horaTermino', 'nomeServico', 'tipoServico', 'turno'];

        // Transforma cada célula em um input editável
        for (let i = 0; i < campos.length; i++) {
            const celula = linha.cells[i];
            let valorAtual = celula.textContent;
            celula.innerHTML = '';

            const input = document.createElement('input');
            input.type = 'text';

            // Lógica especial para a data
            if (campos[i] === 'dataRegistro') {
                const dataObj = dados.dataRegistro.toDate();
                input.type = 'date'; // Usa o tipo 'date' para um melhor seletor
                input.value = dataObj.toISOString().split('T')[0];
            } else {
                input.value = valorAtual;
            }

            input.classList.add('input-edicao');
            celula.appendChild(input);
        }

        // Substitui os botões de ação
        const celulaAcoes = linha.cells[7];
        celulaAcoes.innerHTML = '';

        const btnSalvar = document.createElement('button');
        btnSalvar.textContent = 'Salvar';
        btnSalvar.classList.add('btn', 'btn-salvar');
        btnSalvar.addEventListener('click', () => salvarEdicao(docId, linha));
        celulaAcoes.appendChild(btnSalvar);

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.classList.add('btn', 'btn-cancelar');
        btnCancelar.addEventListener('click', () => {
            const originalData = JSON.parse(linha.getAttribute('data-original-data'));
            cancelarEdicao(linha, originalData);
        });
        celulaAcoes.appendChild(btnCancelar);
    }

    // NOVO: Função para salvar a edição no Firebase
    async function salvarEdicao(docId, row) {
        try {
            const servicoRef = doc(db, "servicos", docId);
            const dadosAtualizados = {
                nomeFuncionario: row.cells[0].querySelector('input').value,
                dataRegistro: new Date(row.cells[1].querySelector('input').value + 'T00:00:00'),
                horaInicio: row.cells[2].querySelector('input').value,
                horaTermino: row.cells[3].querySelector('input').value,
                nomeServico: row.cells[4].querySelector('input').value,
                tipoServico: row.cells[5].querySelector('input').value,
                turno: row.cells[6].querySelector('input').value
            };

            // Atualiza a data de registro
            await updateDoc(servicoRef, dadosAtualizados);
            alert("Serviço atualizado com sucesso!");
            carregarDadosServicos(); // Recarrega os dados para mostrar as alterações
        } catch (error) {
            console.error("Erro ao atualizar documento: ", error);
            alert("Erro ao salvar. Verifique o console.");
        }
    }

    // NOVO: Função para cancelar a edição
    function cancelarEdicao(row, originalData) {
        row.cells[0].innerHTML = originalData.nomeFuncionario;
        row.cells[1].innerHTML = originalData.dataRegistro.toDate().toLocaleDateString('pt-BR');
        row.cells[2].innerHTML = originalData.horaInicio;
        row.cells[3].innerHTML = originalData.horaTermino;
        row.cells[4].innerHTML = originalData.nomeServico;
        row.cells[5].innerHTML = originalData.tipoServico;
        row.cells[6].innerHTML = originalData.turno;

        const cellAcoes = row.cells[7];
        cellAcoes.innerHTML = '';

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.classList.add('btn', 'btn-editar');
        btnEditar.addEventListener('click', () => iniciarEdicao(row.getAttribute('data-doc-id'), originalData, row));
        cellAcoes.appendChild(btnEditar);

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.classList.add('btn', 'btn-excluir');
        btnExcluir.addEventListener('click', () => excluirServico(row.getAttribute('data-doc-id')));
        cellAcoes.appendChild(btnExcluir);
    }

    // NOVO: Função para excluir um serviço
    async function excluirServico(docId) {
        if (confirm("Tem certeza que deseja excluir este serviço?")) {
            try {
                const servicoRef = doc(db, "servicos", docId);
                await deleteDoc(servicoRef);
                alert("Serviço excluído com sucesso!");
                carregarDadosServicos(); // Recarrega os dados para remover a linha
            } catch (error) {
                console.error("Erro ao excluir documento: ", error);
                alert("Erro ao excluir. Verifique o console.");
            }
        }
    }

    // Event Listeners
    formFiltros.addEventListener('submit', (e) => {
        e.preventDefault();
        carregarDadosServicos();
    });

    filtroSelecao.addEventListener('change', () => {
        Object.values(containersFiltro).forEach(container => container.style.display = 'none');
        const filtroSelecionado = filtroSelecao.value;
        if (filtroSelecionado !== 'nenhum') {
            containersFiltro[filtroSelecionado].style.display = 'block';
        }
    });

    btnLimpar.addEventListener('click', () => {
        formFiltros.reset();
        Object.values(containersFiltro).forEach(container => container.style.display = 'none');
        carregarDadosServicos();
    });

    aplicarFiltroMesBtn.addEventListener('click', () => {
        const mesSelecionado = filtroMesInput.value;
        if (mesSelecionado) {
            exibirQuantidadesDeServico(mesSelecionado, true);
            exibirHorasPorFuncionario(mesSelecionado);
        } else {
            alert("Por favor, selecione um mês.");
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            carregarDadosServicos();
        } else {
            window.location.href = 'login.html';
        }
    });

    document.getElementById('logout').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Erro ao fazer logout: ", error);
        }
    });


    // ======================================================================================
    // FIM DAS FUNÇÕES
    // ======================================================================================

    // Listener para o novo botão de filtro por mês
    if (aplicarFiltroMesBtn) {
        aplicarFiltroMesBtn.addEventListener('click', () => {
            exibirQuantidadesDeServico(filtroMesInput.value, true);
            exibirHorasPorFuncionario(filtroMesInput.value);
        });
    }

    // Listener para o botão de alternância (agora mostra contagem)
    toggleBtn.addEventListener('click', () => {
        if (visualizadorHoras.style.display === 'none') {
            visualizadorHoras.style.display = 'block';
            toggleBtn.textContent = 'Ocultar Resumo';
            exibirQuantidadesDeServico(filtroMesInput.value, true);
            exibirHorasPorFuncionario(filtroMesInput.value);
        } else {
            visualizadorHoras.style.display = 'none';
            toggleBtn.textContent = 'Mostrar Resumo';
        }
    });

    // Adiciona os listeners para o modal
    exportarPDFBtn.addEventListener('click', () => {
        modalContainer.style.display = 'flex';
    });

    modalCancelarBtn.addEventListener('click', () => {
        modalContainer.style.display = 'none';
    });

    modalExportarBtn.addEventListener('click', () => {
        const mesSelecionado = modalFiltroData.value;
        if (mesSelecionado) {
            exportarParaPDF(mesSelecionado);
            modalContainer.style.display = 'none';
        } else {
            alert("Por favor, selecione um mês para exportar.");
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            modalContainer.style.display = 'none';
        }
    });

    filtroSelecao.addEventListener('change', (e) => {
        for (const key in containersFiltro) {
            containersFiltro[key].style.display = 'none';
            const input = containersFiltro[key].querySelector('input, select');
            if (input) {
                input.value = '';
            }
        }
        const filtroSelecionado = e.target.value;
        if (filtroSelecionado !== 'nenhum' && containersFiltro[filtroSelecionado]) {
            containersFiltro[filtroSelecionado].style.display = 'block';
        }
    });

    formFiltros.addEventListener('submit', (e) => {
        e.preventDefault();
        carregarDadosServicos();
    });

    btnLimpar.addEventListener('click', () => {
        formFiltros.reset();
        for (const key in containersFiltro) {
            containersFiltro[key].style.display = 'none';
        }
        carregarDadosServicos();
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            carregarDadosServicos();
            exibirQuantidadesDeServico(filtroMesInput.value, true);
            exibirHorasPorFuncionario(filtroMesInput.value);
        } else {
            window.location.href = 'login.html';
        }
    });

    document.getElementById('logout').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Erro ao fazer logout: ", error);
        }
    });
}