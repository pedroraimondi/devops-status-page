const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const servicesPath = path.resolve(__dirname, "../public/services.json");
const allowedStatuses = ["operational", "degraded", "maintenance", "offline"];

test("o arquivo public/services.json existe", () => {
  assert.equal(existsSync(servicesPath), true);
});

const data = JSON.parse(readFileSync(servicesPath, "utf8"));

test("o JSON possui uma lista não vazia de serviços", () => {
  assert.equal(Array.isArray(data.services), true);
  assert.ok(data.services.length > 0);
});

test("todos os serviços possuem os campos obrigatórios", () => {
  for (const service of data.services) {
    assert.equal(typeof service.id, "string");
    assert.ok(service.id.trim().length > 0);
    assert.equal(typeof service.name, "string");
    assert.ok(service.name.trim().length > 0);
    assert.equal(typeof service.description, "string");
    assert.ok(service.description.trim().length > 0);
    assert.equal(typeof service.status, "string");
    assert.ok(service.status.trim().length > 0);
  }
});

test("todos os status pertencem à lista permitida", () => {
  for (const service of data.services) {
    assert.ok(
      allowedStatuses.includes(service.status),
      `Status inválido no serviço ${service.id}: ${service.status}`
    );
  }
});

test("não existem IDs duplicados", () => {
  const ids = data.services.map((service) => service.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("a disponibilidade é numérica e está entre 0 e 100", () => {
  for (const service of data.services) {
    assert.equal(typeof service.availability, "number");
    assert.equal(Number.isFinite(service.availability), true);
    assert.ok(service.availability >= 0);
    assert.ok(service.availability <= 100);
  }
});

test("o histórico de incidentes possui os campos obrigatórios", () => {
  assert.equal(Array.isArray(data.incidents), true);

  for (const incident of data.incidents) {
    assert.equal(typeof incident.title, "string");
    assert.ok(incident.title.trim().length > 0);
    assert.equal(typeof incident.date, "string");
    assert.ok(incident.date.trim().length > 0);
    assert.equal(typeof incident.description, "string");
    assert.ok(incident.description.trim().length > 0);
  }
});

test("as datas dos incidentes usam formato ISO válido", () => {
  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

  for (const incident of data.incidents) {
    assert.match(incident.date, isoDatePattern);
    assert.equal(Number.isNaN(Date.parse(incident.date)), false);
  }
});
