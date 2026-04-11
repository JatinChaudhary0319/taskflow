const { ValidationError } = require("../errors");
const {
  asString,
  oneOf,
  uuidLike,
  dateOnly,
  optionalTextOrNull,
  requiredField,
  failIf,
} = require("../validate");

/**
 * @param {object} spec
 * @param {Record<string, { required?: boolean, optional?: boolean, parse: (v: unknown) => unknown }>|((src: object, req: import('express').Request) => object)} [spec.body]
 * @param {Record<string, { required?: boolean, optional?: boolean, parse: (v: unknown) => unknown }>|((src: object, req: import('express').Request) => object)} [spec.params]
 * @param {Record<string, { required?: boolean, optional?: boolean, parse: (v: unknown) => unknown }>|((src: object, req: import('express').Request) => object)} [spec.query]
 */
function validateRequest(spec) {
  return (req, res, next) => {
    try {
      const validated = {};
      if (spec.body != null) {
        validated.body =
          typeof spec.body === "function"
            ? spec.body(req.body || {}, req)
            : validateSection(req.body, spec.body);
      }
      if (spec.params != null) {
        validated.params =
          typeof spec.params === "function"
            ? spec.params(req.params || {}, req)
            : validateSection(req.params, spec.params);
      }
      if (spec.query != null) {
        validated.query =
          typeof spec.query === "function"
            ? spec.query(req.query || {}, req)
            : validateSection(req.query, spec.query);
      }
      req.validated = validated;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function validateSection(source, spec) {
  const fields = {};
  const out = {};
  for (const [key, def] of Object.entries(spec)) {
    const raw = source?.[key];
    const required = def.required !== false && def.optional !== true;
    if (!required && raw === undefined) continue;
    const v = def.parse(raw);
    if (v == null) {
      if (required) fields[key] = def.message || "is required";
      else if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
        fields[key] = def.message || "is invalid";
      }
      continue;
    }
    out[key] = v;
  }
  if (Object.keys(fields).length) throw new ValidationError(fields);
  return out;
}

function optionalDescription(raw) {
  if (raw === undefined) return undefined;
  const d = optionalTextOrNull(raw);
  if (d.kind === "skip") return undefined;
  return d.value === "" ? null : d.value;
}

function parseAuthRegisterBody(body) {
  const fields = {};
  const name = requiredField(fields, "name", body?.name, asString);
  const email = requiredField(fields, "email", body?.email, asString);
  const password = requiredField(fields, "password", body?.password, asString);
  failIf(fields);
  return { name, email, password };
}

function parseAuthLoginBody(body) {
  const fields = {};
  const email = requiredField(fields, "email", body?.email, asString);
  const password = requiredField(fields, "password", body?.password, asString);
  failIf(fields);
  return { email, password };
}

function parseProjectCreateBody(body) {
  const fields = {};
  const name = requiredField(fields, "name", body?.name, asString);
  failIf(fields);
  const d = optionalTextOrNull(body?.description);
  const description = d.kind === "skip" ? undefined : d.value === "" ? null : d.value;
  return { name, description };
}

function parseProjectUpdateBody(body) {
  const out = {};
  if (body?.name !== undefined) {
    const n = asString(body.name);
    if (n == null) throw new ValidationError({ name: "is required" });
    out.name = n;
  }
  if (body?.description !== undefined) {
    const d = optionalTextOrNull(body.description);
    out.description = d.kind === "skip" ? undefined : d.value === "" ? null : d.value;
  }
  return out;
}

function parseProjectIdParam(params) {
  const fields = {};
  const id = requiredField(fields, "id", params?.id, uuidLike);
  failIf(fields);
  return { id };
}

function parseTaskIdParam(params) {
  const fields = {};
  const raw = params?.id ?? params?.taskId;
  const id = requiredField(fields, "id", raw, uuidLike);
  failIf(fields);
  return { id };
}

function parseTaskListQuery(query) {
  const status = query?.status ? oneOf(query.status, ["todo", "in_progress", "done"]) : null;
  if (query?.status && !status) throw new ValidationError({ status: "is invalid" });

  const assigneeId = query?.assignee ? uuidLike(query.assignee) : null;
  if (query?.assignee && !assigneeId) throw new ValidationError({ assignee: "is invalid" });

  const page = query?.page ? Number.parseInt(String(query.page), 10) : null;
  const limit = query?.limit ? Number.parseInt(String(query.limit), 10) : null;

  return {
    status,
    assigneeId,
    page: Number.isFinite(page) && page > 0 ? page : null,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : null,
  };
}

function parseTaskCreateBody(body) {
  const fields = {};
  const title = requiredField(fields, "title", body?.title, asString);
  failIf(fields);

  const desc = optionalTextOrNull(body?.description);
  const description = desc.kind === "skip" ? undefined : desc.value === "" ? null : desc.value;

  let status = "todo";
  if (body?.status !== undefined && body?.status !== null && body?.status !== "") {
    const s = oneOf(body.status, ["todo", "in_progress", "done"]);
    if (!s) throw new ValidationError({ status: "is invalid" });
    status = s;
  }

  let priority = "medium";
  if (body?.priority !== undefined && body?.priority !== null && body?.priority !== "") {
    const p = oneOf(body.priority, ["low", "medium", "high"]);
    if (!p) throw new ValidationError({ priority: "is invalid" });
    priority = p;
  }

  const assigneeRaw = body?.assignee_id !== undefined ? body.assignee_id : body?.assignee;
  let assigneeId;
  if (assigneeRaw === undefined) assigneeId = undefined;
  else if (assigneeRaw === null) assigneeId = null;
  else {
    assigneeId = uuidLike(assigneeRaw);
    if (assigneeId == null) throw new ValidationError({ assignee_id: "is invalid" });
  }

  let dueDate;
  if (body?.due_date === undefined) dueDate = undefined;
  else if (body?.due_date === null) dueDate = null;
  else {
    const dueDateStr = dateOnly(body.due_date);
    if (!dueDateStr) throw new ValidationError({ due_date: "is invalid" });
    dueDate = new Date(`${dueDateStr}T00:00:00.000Z`);
  }

  return {
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
  };
}

function parseTaskPatchBody(body) {
  const patch = {};

  if (body?.title !== undefined) {
    const v = asString(body.title);
    if (v == null) throw new ValidationError({ title: "is required" });
    patch.title = v;
  }

  if (body?.description !== undefined) {
    const d = optionalTextOrNull(body.description);
    patch.description = d.value === "" ? null : d.value;
  }

  if (body?.status !== undefined) {
    const s = oneOf(body.status, ["todo", "in_progress", "done"]);
    if (!s) throw new ValidationError({ status: "is invalid" });
    patch.status = s;
  }

  if (body?.priority !== undefined) {
    const p = oneOf(body.priority, ["low", "medium", "high"]);
    if (!p) throw new ValidationError({ priority: "is invalid" });
    patch.priority = p;
  }

  if (body?.assignee_id !== undefined || body?.assignee !== undefined) {
    const raw = body?.assignee_id !== undefined ? body.assignee_id : body.assignee;
    if (raw === null) patch.assignee_id = null;
    else {
      const id = uuidLike(raw);
      if (id == null) throw new ValidationError({ assignee_id: "is invalid" });
      patch.assignee_id = id;
    }
  }

  if (body?.due_date !== undefined) {
    if (body.due_date === null) {
      patch.due_date = null;
    } else {
      const s = dateOnly(body.due_date);
      if (!s) throw new ValidationError({ due_date: "is invalid" });
      patch.due_date = new Date(`${s}T00:00:00.000Z`);
    }
  }

  return patch;
}

module.exports = {
  validateRequest,
  parseAuthRegisterBody,
  parseAuthLoginBody,
  parseProjectCreateBody,
  parseProjectUpdateBody,
  parseProjectIdParam,
  parseTaskIdParam,
  parseTaskListQuery,
  parseTaskCreateBody,
  parseTaskPatchBody,
};
