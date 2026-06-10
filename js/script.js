emailjs.init('2eMfdE1GQKr8lsBkC');

document.addEventListener('DOMContentLoaded', () => {
    let ci;
    let nivelPermiso;

    let diasDisponibles = [];
    let usuarioActualCI = null;
    let nombreUsuario = null;
    let usuarioCuerda = null;
    let currentMonth = 6;
    let currentYear = 2026;
    let botonActivo = null;

    const loginForm = document.getElementById('form-login');
    const ciInput = document.getElementById('nro-doc-login');
    const errorMsg = document.getElementById('error-documento');
    const loginWrapper = document.getElementById('contenedor-login');
    const calendarContainer = document.getElementById('contenedor-calendario');

    // Modal bootstrap
    const modalEl = document.getElementById('modalConfirmacion');
    const modal = new bootstrap.Modal(modalEl);
    const modalMensaje = document.getElementById('modalConfirmacionMensaje');
    const btnConfirmar = document.getElementById('modalConfirmarBtn');
    const btnCancelar = document.getElementById('modalCancelarBtn');

    /* --- Supabase --- */

    const SUPABASE_URL = "https://gvgpzsntqgbezxfkpfey.supabase.co"
    const SUPABASE_KEY = "sb_publishable_F7d2Ork5-3gdQV62WuHtgQ_86jmxFZg"

    const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
    )

    /* --- Calendario --- */

    const calendarGrid = document.getElementById("contenedor-celdas");

    async function obtenerDiasConHorarios() {

        const { data, error } = await supabaseClient
            .from("Grupos")
            .select("GrupoDia")

        if(error){
            console.error(error)
            return []
        }

        diasDisponibles = [
                ...new Set (data.map(
                item => item.GrupoDia
                )
            )
        ]   

    }

    async function actualizarEstadoBotones() {
    /*  const gruposAgendados = await contarGruposAgendados(usuarioActualCI);
        const maxGruposPermitidos = await obtenerCvpaUsuario(usuarioActualCI); */

        const botones = document.querySelectorAll('.reserve');

        botones.forEach(boton => {
            const estaAgendado = boton.classList.contains('btn-success');

            /* if (gruposAgendados >= maxGruposPermitidos && !estaAgendado) {
                boton.disabled = true;
                boton.classList.remove('btn-outline-primary');
                boton.classList.add('btn-secondary');
            } else  */
                if (!estaAgendado) {
                boton.disabled = false;
                boton.classList.remove('btn-secondary');
                boton.classList.add('btn-outline-primary');
                boton.textContent = 'Agendarme';
                }
        });
    }

    async function actualizarIntegrantesGrupo(grupoId) {
        const { data: inscriptos, error } = await supabaseClient
            .from("Inscripciones")
            .select("Integrantes (Nombre)")
            .eq("grupoID", grupoId);

        if (error) {
            console.error("Error actualizando integrantes del grupo:", error);
            return;
        }

        let integrantesHTML = "";
        if (inscriptos && inscriptos.length > 0) {
            integrantesHTML = inscriptos.map(row => `<li>${row.Integrantes.Nombre}</li>`).join("");
        } else {
            integrantesHTML = "<li>Todavía no hay integrantes en este grupo</li>";
        }

        const grupoElemento = document.querySelector(`.accordion-item[data-grupo-id="${grupoId}"]`);
        if (grupoElemento) {
            const listaIntegrantes = grupoElemento.querySelector(".accordion-body ul");
            if (listaIntegrantes) {
            listaIntegrantes.innerHTML = integrantesHTML;
            }
        }
    }

    async function renderCalendar(year, month){

        calendarGrid.innerHTML = "";

        // Primer día del mes
        const firstDay = new Date(year, month, 1);

        // Último día del mes
        const lastDay = new Date(year, month + 1, 0);

        // Número de días del mes
        const totalDays = lastDay.getDate();

        // Día de la semana del primer día
        let startDay = firstDay.getDay();

        // Ajuste para comenzar en lunes
        startDay = startDay === 0 ? 6 : startDay - 1;

        // Celdas vacías
        for(let i = 0; i < startDay; i++){

            const emptyCell = document.createElement("div");

            emptyCell.classList.add("day", "empty");

            calendarGrid.appendChild(emptyCell);
        }

        await obtenerDiasConHorarios();
        // Días del mes
        for(let day = 1; day <= totalDays; day++){

            const dayCell = document.createElement("div");        

            dayCell.classList.add("day");

            dayCell.textContent = day;
        
            let fechaActual = `${String(currentYear)}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (diasDisponibles.includes(fechaActual)) {
                dayCell.classList.add("enabled-days");
                dayCell.style.cursor = "pointer";
                dayCell.addEventListener("click", () => {
                    seleccionarDia(currentYear, currentMonth, day);
                });
            } else {
                dayCell.classList.add("not-enabled-days");
            }


            calendarGrid.appendChild(dayCell);
        }
    }

    function actualizarUI() {
    /*     mesLabel.textContent = monthNames[currentMonth];
        flechaAtras.classList.toggle("oculto", currentMonth === 0);
        flechaAdelante.classList.toggle("oculto", currentMonth === monthNames.length - 1); */
        renderCalendar(currentYear,currentMonth);
    }

    function seleccionarDia(year, month, day) {
        fechaSeleccionada.year = year;
        fechaSeleccionada.month = month;
        fechaSeleccionada.day = day;

        document.querySelectorAll(".selected-day").forEach(el => el.classList.remove("selected-day"));

        document.querySelectorAll("#calendar-days div").forEach(cell => {
        if (parseInt(cell.textContent) === day && cell.classList.contains("enabled-days")) {
            cell.classList.add("selected-day");
        }
        });

        const h5 = document.getElementById("fecha-seleccionada");
        const hr = document.getElementById("separador-fecha");
        if (!h5 || !hr) return;

        const fecha = new Date(year, month, day);
        h5.textContent = formatearFechaSinComa(fecha);
        h5.style.display = 'block';
        hr.style.display = 'block';

       cargarGruposDelDia(fecha); 
    }

    const fechaSeleccionada = { year: null, month: null, day: null };

    async function obtenerCuerdaUsuario(usuarioCI) {
        const { data, error } = await supabaseClient
            .from('Integrantes')
            .select('Cuerda')
            .eq('CI', usuarioCI)
            .single();

        if (error) {
            console.error('Error al obtener cuerda:', error);
            usuarioCuerda = null;
            return;
        }

        if (!data || !data.Cuerda) {
            usuarioCuerda = null;
            return;
        }

        usuarioCuerda = data.Cuerda;

        return usuarioCuerda;
    }

     function formatearFechaSinComa(fecha) {
        const partes = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
        }).formatToParts(fecha);

        const nombreDia = partes.find(p => p.type === 'weekday')?.value || '';
        const dia = partes.find(p => p.type === 'day')?.value || '';
        const mes = partes.find(p => p.type === 'month')?.value || '';
        const nombreDiaCap = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
        return `${nombreDiaCap} ${dia} de ${mes}`;
    }

    async function obtenerCupoGrupoPorUsuarioTipo(grupoID) {
        if (!usuarioCuerda) {
            console.error("usuarioCuerda no definida");
            return 0;
        }

        let columna = null;
        /* switch (usuarioCuerda) {
            case "S":
            columna = "CupoS";
            break;
            case "M":
            columna = "CupoM";
            break;
            case "T":
            columna = "CupoT";
            break;
            case "B":
            columna = "CupoB";
            break;
            default:
            console.error("usuarioCuerda desconocido:", usuarioCuerda);
            return 0;
        }
 */

        switch (usuarioCuerda) {
            case "PI":
            columna = "CupoPI";
            break;
            case "M":
            columna = "CupoM";
            break;
            case "PD":
            columna = "CupoPD";
            break;
            default:
            console.error("usuarioCuerda desconocido:", usuarioCuerda);
            return 0;
        }

        const { data, error } = await supabaseClient
            .from("Grupos")
            .select(columna)
            .eq("GrupoID", grupoID)
            .single();

        if (error) {
            console.error("Error al obtener cupo del grupo:", error);
            return 0;
        }

        return data ? data[columna] || 0 : 0;
    }

    
    async function modificarCupoGrupoPorUsuarioTipo(grupoID, usuarioCuerda) {
        let columna;
        /* switch (usuarioCuerda) {
            case "S":
                columna = "CupoS";
                break;
            case "M":
                columna = "CupoM";
                break;
            case "T":
                columna = "CupoT";
                break;
            case "B":
                columna = "CupoB";
                break;
            default:
                console.error("Cuerda de usuario no reconocida");
                return;
        } */

        switch (usuarioCuerda) {
            case "PI":
                columna = "CupoPI";
                break;
            case "M":
                columna = "CupoM";
                break;
            case "PD":
                columna = "CupoPD";
                break;            
            default:
                console.error("Cuerda de usuario no reconocida");
                return;
        }

        const { data, error } = await supabaseClient
            .from("Grupos")
            .select(columna)
            .eq("GrupoID", grupoID)
            .single();

        if (error) {
            console.error("Error al obtener cupo: ", error);
            return;
        }

        const cupoActual = data ? data[columna] : null;

        if (cupoActual === null) {
            console.error('No se pudo obtener el cupo actual');
            return;
        }

        let errorUpdate;

        if (cupoActual === 1) {
            const { errorResta } = await supabaseClient
                .from("Grupos")
                .update({ [columna]: cupoActual - 1 })
                .eq("GrupoID", grupoID);
            errorUpdate = errorResta;
        } else if(cupoActual === 0) {
            const { errorSuma } = await supabaseClient
                .from("Grupos")
                .update({ [columna]: cupoActual + 1 })
                .eq("GrupoID", grupoID);
            errorUpdate = errorSuma;
        }

        if (errorUpdate) {
            console.error("Error al actualizar cupo:", errorUpdate);
        }

    }

    async function sumarCupos(grupoID){
        const { data, error } = await supabaseClient
            .from("Grupos")
            //.select("CupoS, CupoM, CupoT, CupoB")
            .select("CupoPI,CupoM,CupoPD")
            .eq("GrupoID", grupoID)
            .single();

            if (error) {
                console.error("Error al obtener cupos: ", error);
                return null;
            }

            if (!data) {
                console.error("No se encontró el grupo con id: ", grupoID);
                return null;
            }

        //let total = data.CupoS + data.CupoM + data.CupoT + data.CupoB;
        let total = data.CupoPI + data.CupoM + data.CupoPD;
        return total;
    }

    async function obtenerNivelPermiso(ci){
        const { data, error } = await supabaseClient
            .from("Integrantes")
            .select("nivel_permiso")
            .eq("CI", ci)
            .single();

        if (error) {
            console.error("Error al obtener nivel permiso: ", error);
            return null;
        }

        if (!data) {
            console.error("No se encontró información sobre nivel permiso de: ", ci);
            return null;
        }

        const nivelPermisoIntegrante = data.nivel_permiso;
        return nivelPermisoIntegrante;
    }

    /* ----------------- Modales ----------------- */

    function mostrarModalSoloOk(mensaje) {
        modalMensaje.textContent = mensaje;
        btnConfirmar.textContent = "OK";
        btnCancelar.style.display = "none";
        btnConfirmar.onclick = () => {
            modal.hide();
        };
        modal.show();
    }

   function mostrarModalConfirmacion(mensaje, onConfirm) {
        modalMensaje.textContent = mensaje;
        btnConfirmar.textContent = "Confirmar";
        btnCancelar.style.display = "inline-block";

        btnConfirmar.onclick = async () => {
            if (btnConfirmar.disabled) {
                console.log("CLICK IGNORADO");
                return;
            }

            btnConfirmar.disabled = true;

            try {
                console.log("CONFIRMAR PRESIONADO");
                await onConfirm();
            } finally {
                btnConfirmar.disabled = false;
            }
        };

        modal.show();
    }
    /* ------------------------------------------- */


    /* --- Mails --- */

    async function obtenerDirMailIntegrantes(grupoID) {

        const { data: inscripciones, error: errorInscripciones } = await supabaseClient
            .from("Inscripciones")
            .select("integranteCI")
            .eq("grupoID", grupoID);

        if (errorInscripciones) {
            console.error("Error obteniendo inscripciones: ", errorInscripciones);
            return [];
        }

        const ids = inscripciones.map(item => item.integranteCI);

        if (ids.length === 0) {
            console.log("No hay integrantes en este grupo");
            return [];
        }

        const { data: integrantes, error: errorIntegrantes } = await supabaseClient
            .from("Integrantes")
            .select("Mail")
            .in("CI", ids);

        if (errorIntegrantes) {
            console.error("Error obteniendo mails: ", errorIntegrantes);
            return [];
        }

        const mails = integrantes.map(item => item.Mail);

        return mails;
    }

    async function enviarCorreo(email, grupo, diaGrupo, horaGrupo) {
        const params = {
            email: email,
            grupo: grupo,
            dia_grupo: diaGrupo,
            hora_grupo: horaGrupo,
        };
        
        try {
        const response = await emailjs.send(
            /* 'service_jv9n0yr',
            'template_a9cc0oa', */

            'service_qt3lpxi',
            'template_a9cc0oa',

            params
        );
        console.log('Correo enviado', response.status, response.text);

        } catch (error) {
            console.error('Error al enviar correo', error);
        }
    }

    /* --- Excel --- */

    async function exportarExcel() {
        const { data: grupos } = await supabaseClient
            .from("Grupos")
            .select("GrupoID")
            .order("GrupoID", { ascending: true });

        const response = await fetch("xls/CuadernoEvaluacionesCNNS2026.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
        const sheet = workbook.sheet(0);

        //const cuerdasOrder = ["S", "M", "T", "B"];
        const cuerdasOrder = ["PI", "M", "PD"];
        let filaActual = 4;

        for (const grupo of grupos) {
            const { data: Inscripciones } = await supabaseClient
            .from("Inscripciones")
            .select("integranteCI")
            .eq("grupoID", grupo.GrupoID);

            if (!Inscripciones || Inscripciones.length === 0) {
                filaActual += cuerdasOrder.length;
                continue;
            }

            const idsIntegrantes = Inscripciones.map((i) => i.integranteCI);

            const { data: integrantes } = await supabaseClient
                .from("Integrantes")
                .select("CI, Cuerda, Nombre")
                .in("CI", idsIntegrantes);

            /* let posiciones = {
                S: null,
                M: null,
                T: null,
                B: null
            }; */

            let posiciones = {
                PI: null,
                M: null,
                PD: null
            };

            integrantes.forEach((int) => {
                posiciones[int.Cuerda] = int.Nombre || int.Ci;
            });

            cuerdasOrder.forEach((Cuerda) => {
                const valor = posiciones[Cuerda];
                if (valor) {
                    sheet.cell(`C${filaActual}`).value(valor); 
                }
                filaActual++;
            });
        }

        const blob = await workbook.outputAsync();
        const url = URL.createObjectURL(new Blob([blob]));
        const a = document.createElement("a");
        a.href = url;
        a.download = "integrantes_por_grupo.xlsx";
        a.click();
    }


    /* --- Login --- */

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        ci = ciInput.value.trim();

        /* if (!/^\d+$/.test(ci)) {
        errorMsg.textContent = "No ingrese letras ni caracteres especiales";
        errorMsg.style.display = 'block';
        return;
        } */

        /* if (ci.length !== 8) {
        errorMsg.textContent = "Debe ingresar 8 dígitos";
        errorMsg.style.display = 'block';
        return;
        } */

        try {
            const { data, error } = await supabaseClient
                .from("Integrantes")
                .select("CI, Nombre")
                .eq("CI", ci);

            if (error) {
                console.error("Error al consultar Supabase: ", error);
                errorMsg.textContent = "Ocurrió un error al verificar el documento.";
                errorMsg.style.display = 'block';
                errorMsg.style.color = 'red';
                return;
            }

            if (!data || data.length === 0) {
                errorMsg.textContent = "El documento ingresado no está habilitado para acceder";
                errorMsg.style.display = 'block';
                errorMsg.style.color = 'red';
                return;
            }

            usuarioActualCI = ci;
            usuarioCuerda = await obtenerCuerdaUsuario(usuarioActualCI); 

            nombreUsuario = data[0].Nombre;

            errorMsg.style.display = 'none';
            loginWrapper.style.display = 'none';
            calendarContainer.style.display = 'flex';

            nivelPermiso = await obtenerNivelPermiso(ci);
            if (nivelPermiso !== 1) {            
                const nombreIntegrante = document.getElementById('nombreOIExcel');
                nombreIntegrante.textContent = nombreUsuario; 
            }else{
                // Icono excel
                const iconoExcel = document.getElementById('nombreOIExcel');
                iconoExcel.innerHTML = `<img src="assets/img/excel.png" alt="Exportar a Excel" style="width:20px; height:20px;">`;
                iconoExcel.classList.add('icono-excel');

                iconoExcel.onclick = async () => {
                    await exportarExcel();
                };
            }

            await obtenerDiasConHorarios();
            actualizarUI();

        } catch (err) {
        console.error("Error inesperado: ", err);
        errorMsg.textContent = "Ocurrió un error inesperado.";
        errorMsg.style.display = 'block';
        }
    });


 async function cargarGruposDelDia(fecha) {
        const contenedor = document.getElementById("accordionFlushExample");
        contenedor.innerHTML = "";

        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        const fechaISO = `${yyyy}-${mm}-${dd}`;

        const { data: grupos, error } = await supabaseClient
            .from("Grupos")
            .select("*")
            .eq("GrupoDia", fechaISO)
            .order("GrupoHoraInicio", { ascending: true });

        if (error) {
            console.error("Error cargando grupos del día: ", error);
            return;
        }

        if (!grupos || grupos.length === 0) {
            contenedor.innerHTML = "<p class='text-center'>No hay grupos para este día.</p>";
            return;
        }

        const grupoIDs = grupos.map(g => g.GrupoID);
        let inscripcionesUsuario = [];
        if (usuarioActualCI) {
            const { data: inscData, error: errorInsc } = await supabaseClient
                .from('Inscripciones')
                .select('id, grupoID')
                .eq('integranteCI', usuarioActualCI)
                .in('grupoID', grupoIDs);

            if (errorInsc) {
                console.error("Error cargando inscripciones del usuario: ", errorInsc);
            } else {
                inscripcionesUsuario = inscData || [];
            }
        }

        for (let i = 0; i < grupos.length; i++) {
            const grupo = grupos[i];
            const id = `flush-collapse-${i}`;
            const nombreGrupo = grupo.GrupoDsc || `Grupo ${i + 1}`;
            const horaInicio = grupo.GrupoHoraInicio.slice(0,5);
            const horaFin = grupo.GrupoHoraFin.slice(0,5);
            /* const horaInicio = new Date(grupo.GrupoHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const horaFin = new Date(grupo.GrupoHoraFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 */
            const { data: inscriptos } = await supabaseClient
                .from("Inscripciones")
                .select("Integrantes (Nombre)")
                .eq("grupoID", grupo.GrupoID);

            let integrantesHTML = "";
            if (inscriptos && inscriptos.length > 0) {
                integrantesHTML = inscriptos.map(row => `<li>${row.Integrantes.Nombre}</li>`).join("");
            } else {
                integrantesHTML = "<li>Todavía no hay integrantes en este grupo</li>";
            }

            const inscripcionUsuario = inscripcionesUsuario.find(insc => insc.grupoID === grupo.GrupoID);
            const estaInscripto = !!inscripcionUsuario;
            const dataInscripcionIdAttr = estaInscripto ? `data-inscripcion-id="${inscripcionUsuario.id}"` : '';
            let botonOIconoHTML = "";

                let totalCupos = await sumarCupos(grupo.GrupoID);
                let botonClase;
                const botonTexto = estaInscripto ? 'Cancelar' : 'Agendarme';             
                if (totalCupos !== 0){
                    botonClase = estaInscripto ? 'btn-success' : 'btn-outline-primary';                
                }else{
                    botonClase = 'btn-hidden';
                }           


            if (nivelPermiso === 1) {
                
                botonOIconoHTML = `
                    <img 
                        src="assets/img/editar.png" 
                        alt="Editar" 
                        class="icono-editar" 
                        data-grupo-id="${grupo.GrupoID}" 
                        style="width: 20px; height: 20px; cursor: pointer;"
                    >
                `;

            }else{
                botonOIconoHTML = `
                <button class="btn btn-sm reserve ${botonClase}" ${dataInscripcionIdAttr}>${botonTexto}</button>
            `;
            }
            

            contenedor.innerHTML += `
                <div class="accordion-item" data-grupo-id="${grupo.GrupoID}">

                    <div class="grupo-container">

                        <div class="accordion-main">

                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#${id}"
                                    aria-expanded="false"
                                    aria-controls="${id}">

                                    ${nombreGrupo} <b>${horaInicio} - ${horaFin}</b>

                                </button>
                            </h2>

                            <div id="${id}"
                                class="accordion-collapse collapse"
                                data-bs-parent="#accordionFlushExample">

                                <div class="accordion-body">
                                    <ul>${integrantesHTML}</ul>
                                </div>

                            </div>

                        </div>

                        ${botonOIconoHTML}

                    </div>

                </div>`;
        }

        document.addEventListener("click", async function (e) {
            if (e.target.classList.contains("icono-editar")) {
                const grupoId = e.target.dataset.grupoId;

                const { data: inscripciones, error: e1 } = await supabaseClient
                    .from('Inscripciones')
                    .select('integranteCI')
                    .eq('grupoID', grupoId);

                if (e1) {
                    console.error("Error al obtener inscripciones:", e1);
                    return;
                }

                const ids = inscripciones.map(i => i.integranteCI);
                let inscriptos = [];
                if (ids.length > 0) {
                    const { data: integrantesData, error: e2 } = await supabaseClient
                        .from('Integrantes')
                        .select('CI, Nombre')
                        .in('CI', ids);

                    if (e2) {
                        console.error("Error al obtener datos de integrantes:", e2);
                        return;
                    }
                    inscriptos = integrantesData;
                }

                let integrantesHTML = "";
                let footerHTML = "";

                if (inscriptos.length > 0) {
                    // Lista de integrantes con checkboxes
                    integrantesHTML = `
                        <ul style="list-style: none; padding-left: 0;">
                            ${inscriptos.map(row => `
                                <li class="form-check">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        value="${row.CI}" 
                                        id="chk-${row.CI}">
                                    <label class="form-check-label" for="chk-${row.CI}">
                                        ${row.Nombre}
                                    </label>
                                </li>
                            `).join("")}
                        </ul>
                    `;

                    footerHTML = `
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" id="modalConfirmarEdicionBtn" class="btn btn-primary" data-grupo-id="${grupoId}">
                            Eliminar inscripciones
                        </button>
                    `;
                } else {
                    integrantesHTML = "<p>Todavía no hay integrantes en este grupo</p>";
                    footerHTML = `<button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>`;
                }

                const modalBody = document.querySelector("#modalEdicionGrupo .modal-body");
                const modalFooter = document.querySelector("#modalEdicionGrupo .modal-footer");
                modalBody.innerHTML = integrantesHTML;
                modalFooter.innerHTML = footerHTML;

                // Mostrar modal
                const modalEl = document.getElementById("modalEdicionGrupo");
                const modal = new bootstrap.Modal(modalEl);
                modal.show();


                const btnGuardar = document.getElementById("modalConfirmarEdicionBtn");
                if (btnGuardar) {
                    btnGuardar.addEventListener("click", async function () {
                        const grupoId = this.dataset.grupoId;

                        // Obtener checkboxes seleccionados
                        const seleccionados = Array.from(modalBody.querySelectorAll(".form-check-input:checked"))
                            .map(chk => chk.value);

                        if (seleccionados.length > 0) {
                            // Eliminar inscripciones
                            const { error: deleteError } = await supabaseClient
                                .from("Inscripciones")
                                .delete()
                                .in("integranteCI", seleccionados)
                                .eq("grupoID", grupoId);

                            if (deleteError) {
                                console.error("Error eliminando integrantes:", deleteError);
                            } else {
                                console.log("Integrantes eliminados correctamente");
                            }
                        }
                        let tipoUsuarioParaEliminar;
                                        
                        for (let i = 0; i < seleccionados.length; i++) {
                            tipoUsuarioParaEliminar = await obtenerCuerdaUsuario(seleccionados[i]);
                            // Actualizar cupo del grupo según usuarioTipo
                            await modificarCupoGrupoPorUsuarioTipo(grupoId, tipoUsuarioParaEliminar);
                        }

                        // Cerrar modal
                        modal.hide();

                        // Actualizar lista de integrantes en UI
                        await actualizarIntegrantesGrupo(grupoId);
                    }, { once: true }); // evita duplicar listeners
                }
            }
        });

        contenedor.querySelectorAll('.reserve').forEach(boton => {
            boton.addEventListener('click', async function () {
                botonActivo = this;
                let grupoID = this.closest(".accordion-item").dataset.grupoId;

                if (this.classList.contains('btn-success')) {
                    // Cancelar inscripción
                    const inscripcionId = parseInt(this.getAttribute('data-inscripcion-id'));
                    if (!inscripcionId) {
                        modalMensaje.textContent = "No se pudo identificar la inscripción para cancelar.";
                        modal.show();
                        return;
                    }

                    mostrarModalConfirmacion("¿Está seguro de que desea cancelar su reserva?",async () => {
                        // Cancelar inscripción en base de datos
                        const { error } = await supabaseClient
                        .from('Inscripciones')
                        .delete()
                        .eq('id', inscripcionId);

                        if (error) {
                            console.error('Error al cancelar inscripción:', error);
                            modalMensaje.textContent = "Ocurrió un error al cancelar la inscripción.";
                            return;
                        }

                        await modificarCupoGrupoPorUsuarioTipo(grupoID, usuarioCuerda);

                        botonActivo.textContent = 'Agendarme';
                        botonActivo.classList.remove('btn-success');
                        botonActivo.classList.add('btn-outline-primary');
                        botonActivo.removeAttribute('data-inscripcion-id');
                        const accordionItem = botonActivo.closest('.accordion-item');
                        const integrantesList = accordionItem.querySelector('.accordion-body ul');
                        const integrantes = integrantesList.querySelectorAll('li');

                        integrantes.forEach(li => {
                            if (li.textContent.trim() === nombreUsuario) {
                                li.remove();
                            }
                        });

                        if (integrantesList.children.length === 0) {
                            const mensaje = document.createElement('li');
                            mensaje.textContent = 'Todavía no hay integrantes en este grupo.';
                            integrantesList.appendChild(mensaje);
                        }

                        modal.hide();
                        await actualizarEstadoBotones();
                    });

                } else {

                    const cupoDelGrupo = await obtenerCupoGrupoPorUsuarioTipo(parseInt(grupoID));

                    if(cupoDelGrupo === 0){
                        mostrarModalSoloOk("No hay cupos disponibles para su voz en este grupo");
                    }else{

                        mostrarModalConfirmacion("¿Desea agendarse a este grupo?", async () => {   
                            const { data: nuevaInscripcion, error: errorInsert } = await supabaseClient
                                .from('Inscripciones')
                                .insert([{ grupoID: parseInt(grupoID), integranteCI: usuarioActualCI }])
                                .select()
                                .single();

                            if (errorInsert) {
                            console.error('Error al insertar inscripción:', errorInsert);
                            modalMensaje.textContent = "Ocurrió un error al agendarse.";
                            return;
                            }

                            await modificarCupoGrupoPorUsuarioTipo(grupoID, usuarioCuerda);

                            let totalCupoEnGrupo = await sumarCupos(grupoID);        
                            if (totalCupoEnGrupo === 0) {
                                botonActivo.classList.add('btn-hidden');

                                const { data: grupo, error: errorGrupo } = await supabaseClient
                                    .from('Grupos')
                                    .select('GrupoDsc,GrupoDia, GrupoHoraInicio, GrupoHoraFin')
                                    .eq('GrupoID', parseInt(grupoID))
                                    .single();

                                    /* const inicio = new Date(grupo.GrupoHoraInicio);
                                    const fin = new Date(grupo.GrupoHoraFin); */

                                    
                                    const horaInicio = grupo.GrupoHoraInicio;
                                    const horaFin = grupo.GrupoHoraFin;

                                    const fechaGrupo = grupo.GrupoDia;

                                    // Formato solo fecha (dd/mm/yyyy)
                                    /* const formatoFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
                                    const fechaGrupo = fecha.toLocaleDateString('es-ES', formatoFecha); */


                                if (errorGrupo) {
                                    console.error('Error al obtener horario del grupo:', errorGrupo);
                                } else {
                                    let dirMails = await obtenerDirMailIntegrantes(grupoID);
                                    let horarioGrupo = horaInicio + " - " + horaFin;
                                    let grupoNombre = grupo.GrupoDsc;

                                    try {
                                        // Ejecutar todos los envíos en paralelo y esperar a que terminen
                                        await Promise.all(
                                            dirMails.map(email => enviarCorreo(email, grupoNombre, fechaGrupo, horarioGrupo))
                                        );
                                        console.log('Todos los mails enviados');
                                    } catch (err) {
                                        console.error('Error enviando mails:', err);
                                    }
                                }
                    
                            }

                            // Actualizar UI
                            botonActivo.textContent = 'Cancelar';
                            botonActivo.classList.remove('btn-outline-primary');
                            botonActivo.classList.add('btn-success');                        
                            
                            botonActivo.setAttribute('data-inscripcion-id', nuevaInscripcion.id);

                            const accordionItem = botonActivo.closest('.accordion-item');
                            const integrantesList = accordionItem.querySelector('.accordion-body ul');

                            if (integrantesList.children.length === 1 && integrantesList.children[0].textContent.includes('Todavía no hay integrantes')) {
                            integrantesList.innerHTML = '';
                            }

                            const nuevoLi = document.createElement('li');
                            nuevoLi.textContent = nombreUsuario;
                            integrantesList.appendChild(nuevoLi);

                            modal.hide();
                            await actualizarEstadoBotones();
                        });
                        
                    }                

                }

            }); 
        }); 
            
        await actualizarEstadoBotones();

    }   

});