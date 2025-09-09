// Importa os módulos necessários do Firebase
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

if (document.getElementById('form-login')) {
    const formLogin = document.getElementById('form-login');
    const mensagemLogin = document.getElementById('mensagem-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = formLogin.elements.email.value;
        const senha = formLogin.elements.senha.value;

        try {
            // Autentica o usuário com e-mail e senha
            await signInWithEmailAndPassword(auth, email, senha);
            // Se o login for bem-sucedido, redireciona para a página do painel
            window.location.href = 'admin.html';
        } catch (error) {
            console.error("Erro no login: ", error);
            let mensagemDeErro = "Ocorreu um erro. Por favor, tente novamente.";

            // Tratamento de erros específicos do Firebase Auth
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

// Lógica para a página de registro (index.html)
if (document.getElementById('form-servico')) {
    const formServico = document.getElementById('form-servico');
    const mensagem = document.getElementById('mensagem');

    formServico.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome1 = formServico.elements.funcionario1.value;
        const nome2 = formServico.elements.funcionario2.value;
        const nome3 = formServico.elements.funcionario3.value;
        const nome4 = formServico.elements.funcionario4.value;

        const nomesArray = [nome1, nome2, nome3, nome4].filter(nome => nome !== '');

        if (nomesArray.length === 0) {
            mensagem.textContent = "Selecione pelo menos um funcionário.";
            return;
        }

        try {
            for (const nome of nomesArray) {
                await addDoc(collection(db, "servicos"), {
                    nomeFuncionario: nome,
                    dia: formServico.elements.dia.value,
                    horaInicio: formServico.elements.horaInicio.value,
                    horaTermino: formServico.elements.horaTermino.value,
                    nomeServico: formServico.elements.nomeServico.value,
                    tipoServico: formServico.elements.tipoServico.value,
                    turno: formServico.elements.turno.value,
                    // AQUI ESTÁ A ALTERAÇÃO: Salvando a data de forma correta
                    dataRegistro: new Date(formServico.elements.dia.value.replace(/-/g, '\/'))
                });
            }
            mensagem.textContent = "Serviço(s) registrado(s) com sucesso!";
            formServico.reset();
        } catch (e) {
            console.error("Erro ao adicionar documento: ", e);
            mensagem.textContent = "Erro ao registrar serviço. Verifique o console para mais detalhes.";
        }
    });
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
            // Chama a função para exibir no HTML
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
                // Se nenhum filtro foi aplicado, ordena por data de registro mais recente
                q = query(servicosRef, orderBy("dataRegistro", "asc"), orderBy("horaInicio", "asc"), orderBy("nomeFuncionario", "asc"));
            }

            const querySnapshot = await getDocs(q);
            tabelaCorpo.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const dados = doc.data();
                const row = tabelaCorpo.insertRow();
                row.insertCell(0).textContent = dados.nomeFuncionario;

                // Aqui convertemos o timestamp para o formato dd/mm/aaaa
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

        // Pega o ano e o mês do input
        const [ano, mes] = mesSelecionado.split('-').map(Number);

        // Cria um objeto Date para o primeiro dia do mês selecionado
        const dataInicioMes = new Date(ano, mes - 1, 1);

        // Cria um objeto Date para o primeiro dia do próximo mês
        const dataFimMes = new Date(ano, mes, 1);

        // Faz a consulta no Firestore com o filtro de mês
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

        // Se não houver dados, exibe um alerta e não gera o PDF
        if (dadosExportar.length === 0) {
            alert("Nenhum serviço encontrado para o mês selecionado.");
            return;
        }

        // NOVO: Chama a função para obter o HTML do gráfico de horas, sem inseri-lo na página
        const horasDeServicoHTML = await gerarHorasDeServicoHTML(mesSelecionado);

        // Cria a nova tabela HTML em memória
        const tabelaHTML = `
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed; /* Força o layout fixo */
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                    word-wrap: break-word; /* Permite quebras de linha longas */
                }
                th {
                    background-color: #f2f2f2;
                }
                /* Definição das larguras das colunas */
                th:nth-child(1), td:nth-child(1) { width: 13%; } /* Funcionário */
                th:nth-child(2), td:nth-child(2) { width: 12%; } /* Dia */
                th:nth-child(3), td:nth-child(3) { width: 10%; } /* Hora Início */
                th:nth-child(4), td:nth-child(4) { width: 10%; } /* Hora Término */
                th:nth-child(5), td:nth-child(5) { width: 25%; } /* Nome Serviço */
                th:nth-child(6), td:nth-child(6) { width: 15%; } /* Tipo Serviço */
                th:nth-child(7), td:nth-child(7) { width: 10%; } /* Turno */
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

        // Configurações para o PDF
        const opt = {
            margin: 1,
            filename: `relatorio-servicos-${mes}-${ano}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        };

        // Gera e salva o PDF
        html2pdf().from(tabelaHTML).set(opt).save();
    }

    // Adiciona os listeners para o modal
    exportarPDFBtn.addEventListener('click', () => {
        modalContainer.style.display = 'flex'; // Mostra o modal
    });

    modalCancelarBtn.addEventListener('click', () => {
        modalContainer.style.display = 'none'; // Esconde o modal
    });

    modalExportarBtn.addEventListener('click', () => {
        const mesSelecionado = modalFiltroData.value;
        if (mesSelecionado) {
            exportarParaPDF(mesSelecionado);
            modalContainer.style.display = 'none'; // Esconde o modal após exportar
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
            // ACUMULA O TOTAL DE MINUTOS PARA CADA TURNO/TIPO
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

                        // Acumula o total de MINUTOS
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
                    /* Estilos para a barra de progresso no PDF */
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
                // Adiciona o cabeçalho do turno
                horasHTML += `<h3>Turno: ${turno}</h3><ul>`;

                for (const tipo of tiposServico) {
                    // Total de minutos acumulados para o tipo de serviço no turno
                    const totalMinutosAcumulados = (dadosPorTurno[turno] && dadosPorTurno[turno][tipo]) || 0;

                    // --- NOVA LÓGICA DE FORMATAÇÃO HH.MM ---
                    const horasInteiras = Math.floor(totalMinutosAcumulados / 60);
                    const minutosRestantes = totalMinutosAcumulados % 60;

                    // Garante que os minutos tenham dois dígitos (ex: 7 vira 07, 40 vira 40)
                    const minutosFormatados = String(minutosRestantes).padStart(2, '0');

                    // Formato final "horas.minutos"
                    const horasFormatadas = `${horasInteiras}.${minutosFormatados}`;

                    // --- NOVO CÁLCULO DE PORCENTAGEM (baseado em minutos) ---
                    // Converte a meta (que é em horas) para minutos antes de dividir
                    const metaEmMinutos = meta[tipo] * 60;
                    let porcentagem = metaEmMinutos > 0 ? (totalMinutosAcumulados / metaEmMinutos) * 100 : 0;
                    porcentagem = Math.min(porcentagem, 100);

                    horasHTML += `
                    <li>
                        ${tipo}: ${horasFormatadas} horas (${porcentagem.toFixed(0)}%)
                        <div class="progress-bar-container">
                            <div class="progress-bar ${tipo}" style="width: ${porcentagem.toFixed(0)}%;"></div>
                        </div>
                    </li>`;
                }
                horasHTML += '</ul>';
            }

            return horasHTML;

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