window.MESA_FORM_DEFAULTS = {
  areas: [
    { name: 'Odoo', subareas: ['PDV', 'Inventario', 'Ventas', 'Compras'] },
    { name: 'Administración', subareas: ['Facturación', 'Contabilidad', 'Reportes'] },
    { name: 'Clientes', subareas: ['Solicitud', 'Seguimiento', 'Entrega'] },
    { name: 'Operación', subareas: ['Almacén', 'Compras', 'Recepción'] },
    { name: 'Automatización', subareas: ['Hojas de cálculo', 'Flujos', 'Integraciones'] },
    { name: 'Desarrollo', subareas: ['Frontend', 'Backend', 'QA'] }
  ],
  types: ['Solicitud', 'Bug', 'Mejora', 'Seguimiento', 'Configuración', 'Documentación'],
  priorities: ['Media', 'Alta', 'Baja']
};

window.normalizeMesaFormConfig = function normalizeMesaFormConfig(config) {
  const defaults = window.MESA_FORM_DEFAULTS;
  const areas = Array.isArray(config?.areas)
    ? config.areas.map((area) => {
      const name = typeof area === 'string' ? area : area?.name;
      const subareas = typeof area === 'string' ? [] : area?.subareas;
      return { name: String(name || '').trim().replace(/\s+/g, ' '), subareas: [...new Set((Array.isArray(subareas) ? subareas : []).map((item) => String(item).trim()).filter(Boolean))].slice(0, 40) };
    }).filter((area) => area.name).slice(0, 40)
    : [];
  const list = (value, fallback) => {
    const result = Array.isArray(value) ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, 24) : [];
    return result.length ? result : [...fallback];
  };
  return {
    areas: areas.length ? areas : JSON.parse(JSON.stringify(defaults.areas)),
    types: list(config?.types, defaults.types),
    priorities: list(config?.priorities, defaults.priorities)
  };
};
