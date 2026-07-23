const STATUS = {
  operational: { label: "Operacional", symbol: "✓" },
  degraded: { label: "Desempenho degradado", symbol: "!" },
  maintenance: { label: "Em manutenção", symbol: "◆" },
  offline: { label: "Indisponível", symbol: "×" }
};

const elements = {
  loading: document.querySelector("#services-loading"),
  error: document.querySelector("#services-error"),
  grid: document.querySelector("#services-grid"),
  incidents: document.querySelector("#incidents-list"),
  lastUpdate: document.querySelector("#last-update"),
  overall: document.querySelector("#overall-status"),
  total: document.querySelector("#metric-total"),
  operational: document.querySelector("#metric-operational"),
  availability: document.querySelector("#metric-availability")
};

function formatDate(isoDate, includeTime = false) {
  const options = includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { day: "2-digit", month: "short", year: "numeric" };

  return new Intl.DateTimeFormat("pt-BR", options).format(new Date(isoDate));
}

function createServiceCard(service) {
  const status = STATUS[service.status];
  const card = document.createElement("article");
  card.className = `service-card ${service.status}`;

  const top = document.createElement("div");
  top.className = "service-top";

  const name = document.createElement("h3");
  name.className = "service-name";
  name.textContent = service.name;

  const badge = document.createElement("span");
  badge.className = "status-badge";
  badge.innerHTML = `<span aria-hidden="true">${status.symbol}</span> ${status.label}`;

  const description = document.createElement("p");
  description.className = "service-description";
  description.textContent = service.description;

  const availability = document.createElement("div");
  availability.className = "availability-row";
  availability.innerHTML = `
    <span>Disponibilidade nos últimos 30 dias</span>
    <strong>${service.availability.toFixed(2)}%</strong>
  `;

  top.append(name, badge);
  card.append(top, description, availability);
  return card;
}

function renderServices(services) {
  const fragment = document.createDocumentFragment();
  services.forEach((service) => fragment.append(createServiceCard(service)));
  elements.grid.replaceChildren(fragment);
}

function renderIncidents(incidents) {
  const fragment = document.createDocumentFragment();

  incidents.forEach((incident) => {
    const article = document.createElement("article");
    article.className = "incident";

    const date = document.createElement("time");
    date.dateTime = incident.date;
    date.textContent = formatDate(incident.date);

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = incident.title;
    const description = document.createElement("p");
    description.textContent = incident.description;
    const state = document.createElement("span");
    state.className = "incident-state";
    state.innerHTML = '<span aria-hidden="true">✓</span> Resolvido';

    content.append(title, description, state);
    article.append(date, content);
    fragment.append(article);
  });

  elements.incidents.replaceChildren(fragment);
}

function updateSummary(services, updatedAt) {
  const operationalCount = services.filter(
    (service) => service.status === "operational"
  ).length;
  const average =
    services.reduce((sum, service) => sum + service.availability, 0) / services.length;
  const hasOffline = services.some((service) => service.status === "offline");
  const hasImpact = services.some((service) =>
    ["degraded", "maintenance"].includes(service.status)
  );

  elements.total.textContent = String(services.length);
  elements.operational.textContent = `${operationalCount} de ${services.length}`;
  elements.availability.textContent = `${average.toFixed(2)}%`;
  elements.lastUpdate.dateTime = updatedAt;
  elements.lastUpdate.textContent = formatDate(updatedAt, true);

  elements.overall.classList.remove("is-loading");

  if (hasOffline) {
    elements.overall.classList.add("has-outage");
    elements.overall.innerHTML = `
      <span class="overall-icon" aria-hidden="true">×</span>
      <div>
        <strong>Há serviços indisponíveis</strong>
        <p>Nossa equipe está atuando para restaurar a operação.</p>
      </div>
    `;
  } else if (hasImpact) {
    elements.overall.classList.add("has-impact");
    elements.overall.innerHTML = `
      <span class="overall-icon" aria-hidden="true">!</span>
      <div>
        <strong>Alguns serviços requerem atenção</strong>
        <p>O ambiente segue disponível, com impacto parcial em componentes específicos.</p>
      </div>
    `;
  } else {
    elements.overall.innerHTML = `
      <span class="overall-icon" aria-hidden="true">✓</span>
      <div>
        <strong>Todos os sistemas estão operacionais</strong>
        <p>Nenhuma interrupção identificada neste momento.</p>
      </div>
    `;
  }
}

async function loadStatus() {
  try {
    const response = await fetch("services.json");
    if (!response.ok) {
      throw new Error(`Resposta HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.services) || data.services.length === 0) {
      throw new Error("A lista de serviços está vazia");
    }

    renderServices(data.services);
    renderIncidents(data.incidents ?? []);
    updateSummary(data.services, data.updatedAt);
    elements.loading.hidden = true;
  } catch (error) {
    console.error("Falha ao carregar os dados de status:", error);
    elements.loading.hidden = true;
    elements.error.hidden = false;
    elements.lastUpdate.textContent = "Dados indisponíveis";
    elements.overall.classList.remove("is-loading");
    elements.overall.classList.add("has-outage");
    elements.overall.innerHTML = `
      <span class="overall-icon" aria-hidden="true">!</span>
      <div>
        <strong>Status temporariamente indisponível</strong>
        <p>Não foi possível consultar o ambiente agora.</p>
      </div>
    `;
  }
}

loadStatus();
