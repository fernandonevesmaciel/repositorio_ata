import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDdbz1Uuy1vniu3yQUK2JKk7qlYi1qc-_A",
    authDomain: "controle-de-servicos-420f4.firebaseapp.com",
    projectId: "controle-de-servicos-420f4",
    storageBucket: "controle-de-servicos-420f4.firebase-storage.app",
    messagingSenderId: "1096927390065",
    appId: "1:1096927390065:web:6b464e8c69ff3d5166eed0",
    measurementId: "G-VNKBGDEZYE"
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

                // --- CÓDIGO EDITADO ---
                const dataOriginal = new Date(servico.dia + 'T00:00:00'); // Cria um objeto Date
                const dataFormatada = dataOriginal.toLocaleDateString('pt-BR'); // Formata a data para DD/MM/AAAA
                row.insertCell(1).textContent = dataFormatada;
                // --- FIM DO CÓDIGO EDITADO ---

                row.insertCell(2).textContent = servico.horaInicio;
                row.insertCell(3).textContent = servico.horaTermino;
                row.insertCell(4).textContent = servico.nomeServico;
                row.insertCell(5).textContent = servico.tipoServico;
                row.insertCell(6).textContent = servico.turno;

                // Adiciona a célula para o botão de edição
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

            // Preenche o formulário com os dados do serviço
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

            // Remove o serviço da lista e do localStorage
            servicosPendentes.splice(index, 1);
            salvarServicosNoLocalStorage();
            atualizarTabelaPendentes();

            mensagem.textContent = "Serviço carregado no formulário para edição.";
        }
    });

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

    // --- NOVA CONDIÇÃO ADICIONADA AQUI ---
    const horaInicio = formServico.elements.horaInicio.value;
    const horaTermino = formServico.elements.horaTermino.value;

    // Converter as horas para minutos para uma comparação numérica mais fácil
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hTermino, mTermino] = horaTermino.split(':').map(Number);

    const totalMinutosInicio = hInicio * 60 + mInicio;
    const totalMinutosTermino = hTermino * 60 + mTermino;

    if (totalMinutosInicio >= totalMinutosTermino) {
        // Se a hora de início for maior ou igual à de término, exibe o popup
        alert("Atenção: A hora de início não pode ser maior ou igual à hora de término. Por favor, corrija.");
        return; // Interrompe o processo e não adiciona o serviço à lista
    }

        const novoServico = {
            nomesFuncionarios: nomesArray,
            dia: formServico.elements.dia.value,
            horaInicio: formServico.elements.horaInicio.value,
            horaTermino: formServico.elements.horaTermino.value,
            nomeServico: formServico.elements.nomeServico.value,
            tipoServico: formServico.elements.tipoServico.value,
            turno: formServico.elements.turno.value
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

    // Ao carregar a página, tenta carregar os serviços salvos e atualiza a tabela
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

    // Novos elementos do modal
    const exportarPDFBtn = document.getElementById('exportar-pdf');
    const modalContainer = document.getElementById('modal-container');
    const modalFiltroData = document.getElementById('modal-filtro-data');
    const modalExportarBtn = document.getElementById('modal-exportar-btn');
    const modalCancelarBtn = document.getElementById('modal-cancelar-btn');

    // Novos elementos de filtro de horas
    const filtroMesInput = document.getElementById('filtro-mes');
    const aplicarFiltroMesBtn = document.getElementById('aplicar-filtro-mes-btn');

    // Listener para o botão de alternância
    toggleBtn.addEventListener('click', () => {
        if (visualizadorHoras.style.display === 'none') {
            visualizadorHoras.style.display = 'block';
            toggleBtn.textContent = 'Ocultar Horas de Serviço';
            exibirHorasDeServicoPorTurno(filtroMesInput.value, true);
        } else {
            visualizadorHoras.style.display = 'none';
            toggleBtn.textContent = 'Mostrar Horas de Serviço';
        }
    });

    // Listener para o novo botão de filtro por mês
    if (aplicarFiltroMesBtn) {
        aplicarFiltroMesBtn.addEventListener('click', () => {
            exibirHorasDeServicoPorTurno(filtroMesInput.value, true);
        });
    }

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
            } else if (!q) {
                q = query(servicosRef, orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"), orderBy("nomeFuncionario", "asc"));
            }

            const querySnapshot = await getDocs(q);
            tabelaCorpo.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const dados = doc.data();
                const row = tabelaCorpo.insertRow();
                row.insertCell(0).textContent = dados.nomeFuncionario;

                const dataObjeto = dados.dataRegistro.toDate();
                const dataFormatada = dataObjeto.toLocaleDateString('pt-BR');
                row.insertCell(1).textContent = dataFormatada;

                row.insertCell(2).textContent = dados.horaInicio;
                row.insertCell(3).textContent = dados.horaTermino;
                row.insertCell(4).textContent = dados.nomeServico;
                row.insertCell(5).textContent = dados.tipoServico;
                row.insertCell(6).textContent = dados.turno;
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

        const horasDeServicoHTML = await gerarHorasDeServicoHTML(mesSelecionado);

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
                th:nth-child(1), td:nth-child(1) { width: 13%; }
                th:nth-child(2), td:nth-child(2) { width: 12%; }
                th:nth-child(3), td:nth-child(3) { width: 10%; }
                th:nth-child(4), td:nth-child(4) { width: 10%; }
                th:nth-child(5), td:nth-child(5) { width: 25%; }
                th:nth-child(6), td:nth-child(6) { width: 15%; }
                th:nth-child(7), td:nth-child(7) { width: 10%; }
                .progress-bar-container {
                    width: 100%;
                    background-color: #f3f3f3;
                    border-radius: 5px;
                    margin-top: 5px;
                }
                .progress-bar {
                    height: 15px;
                    border-radius: 5px;
                    text-align: center;
                    color: white;
                    font-weight: bold;
                }
                .emergencial { background-color: #ff6384; }
                .qualidade { background-color: #36a2eb; }
                .preventivo { background-color: #cc65fe; }
                .ajuste { background-color: #ff9f40; }
            </style>
            <h1>Relatório de Serviços - Mês: ${mes} / ${ano}</h1>
            <br>
            ${horasDeServicoHTML}
            <table id="tabela-exportar">
                <thead>
                    <tr>
                        <th>Funcionário</th>
                        <th>Dia</th>
                        <th>Hora Início</th>
                        <th>Hora Término</th>
                        <th>Nome Serviço</th>
                        <th>Tipo Serviço</th>
                        <th>Turno</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosExportar.map(dados => `
                        <tr>
                            <td>${dados.nomeFuncionario}</td>
                            <td>${dados.dataRegistro.toDate().toLocaleDateString('pt-BR')}</td>
                            <td>${dados.horaInicio}</td>
                            <td>${dados.horaTermino}</td>
                            <td>${dados.nomeServico}</td>
                            <td>${dados.tipoServico}</td>
                            <td>${dados.turno}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const opt = {
            margin: 1,
            filename: `relatorio-servicos-${mes}-${ano}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        html2pdf().from(tabelaHTML).set(opt).save();
    }

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

    // Evento para fechar o modal clicando fora dele
    window.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            modalContainer.style.display = 'none';
        }
    });

    // FUNÇÃO PARA EXIBIR HORAS COM GRÁFICO E FILTRO DE MÊS
    async function exibirHorasDeServicoPorTurno(mesSelecionado, inserirNoHtml = false) {
        const horasHTML = await gerarHorasDeServicoHTML(mesSelecionado);
        if (inserirNoHtml) {
            const containerDados = document.getElementById('dados-turnos');
            containerDados.innerHTML = horasHTML;
        }
    }

    // NOVA FUNÇÃO para gerar apenas o HTML do gráfico de horas, com a nova lógica de horas.minutos
    async function gerarHorasDeServicoHTML(mesSelecionado) {
        try {
            if (!mesSelecionado) {
                return `<h2>Horas de Serviço por Turno</h2><p>Selecione um mês para exibir os dados.</p>`;
            }

            const turnos = ["1 turno", "2 turno", "3 turno"];
            const tiposServico = ["emergencial", "qualidade", "preventivo", "ajuste"];

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
            const dadosPorTurno = {};

            querySnapshot.forEach(doc => {
                const dados = doc.data();
                const turno = dados.turno;
                const tipo = dados.tipoServico;
                const horaInicio = dados.horaInicio;
                const horaTermino = dados.horaTermino;

                if (turnos.includes(turno) && tiposServico.includes(tipo)) {
                    const [hInicio, mInicio] = (horaInicio || '00:00').split(':').map(Number);
                    const [hTermino, mTermino] = (horaTermino || '00:00').split(':').map(Number);

                    if (!isNaN(hInicio) && !isNaN(mInicio) && !isNaN(hTermino) && !isNaN(mTermino)) {
                        let totalMinutos = (hTermino * 60 + mTermino) - (hInicio * 60 + mInicio);
                        if (totalMinutos < 0) totalMinutos += 24 * 60;

                        if (!dadosPorTurno[turno]) dadosPorTurno[turno] = {};
                        if (!dadosPorTurno[turno][tipo]) dadosPorTurno[turno][tipo] = 0;

                        dadosPorTurno[turno][tipo] += totalMinutos;
                    }
                }
            });

            const meta = { emergencial: 60, qualidade: 70, preventivo: 50, ajuste: 20 };
            let horasHTML = `
                <h2>Horas de Serviço por Turno</h2>
                <style>
                    .progress-bar-container {
                        width: 100%;
                        background-color: #f3f3f3;
                        border-radius: 5px;
                        margin-top: 5px;
                    }
                    .progress-bar {
                        height: 15px;
                        border-radius: 5px;
                        text-align: center;
                        color: white;
                        font-weight: bold;
                    }
                    .emergencial { background-color: #ff6384; }
                    .qualidade { background-color: #36a2eb; }
                    .preventivo { background-color: #cc65fe; }
                    .ajuste { background-color: #ff9f40; }
                </style>
            `;

            if (Object.keys(dadosPorTurno).length === 0) {
                return horasHTML + `<p>Nenhum dado de serviço encontrado para o período selecionado.</p>`;
            }

            for (const turno of turnos) {
                hoursHTML += `<h3>Turno: ${turno}</h3><ul>`;

                for (const tipo of tiposServico) {
                    const totalMinutosAcumulados = (dadosPorTurno[turno] && dadosPorTurno[turno][tipo]) || 0;
                    const horasInteiras = Math.floor(totalMinutosAcumulados / 60);
                    const minutosRestantes = totalMinutosAcumulados % 60;
                    const minutosFormatados = String(minutosRestantes).padStart(2, '0');
                    const horasFormatadas = `${horasInteiras}.${minutosFormatados}`;

                    const metaEmMinutos = meta[tipo] * 60;
                    let porcentagem = metaEmMinutos > 0 ? (totalMinutosAcumulados / metaEmMinutos) * 100 : 0;
                    porcentagem = Math.min(porcentagem, 100);

                    hoursHTML += `
                    <li>
                        ${tipo}: ${horasFormatadas} horas (${porcentagem.toFixed(0)}%)
                        <div class="progress-bar-container">
                            <div class="progress-bar ${tipo}" style="width: ${porcentagem.toFixed(0)}%;"></div>
                        </div>
                    </li>`;
                }
                hoursHTML += '</ul>';
            }

            return hoursHTML;

        } catch (error) {
            console.error("Erro ao gerar HTML para horas de serviço: ", error);
            return `<h2>Horas de Serviço por Turno</h2><p>Erro ao carregar os dados.</p>`;
        }
    }

    // Adiciona o listener para o filtro de seleção
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
            exibirHorasDeServicoPorTurno(filtroMesInput.value, true);
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