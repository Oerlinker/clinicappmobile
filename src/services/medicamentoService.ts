import api from '../api';

export interface Medicamento {
  id: number;
  nombre: string;
  descripcion: string;
  fabricante: string;
  efectosSecundarios: string;
  activo: boolean;
}

export interface MedicamentoDTO {
  nombre: string;
  descripcion: string;
  fabricante: string;
  efectosSecundarios: string;
}

const getAllMedicamentos = () => {
  return api.get('/medicamentos');
};

const getMedicamentoById = (id: number) => {
  return api.get(`/medicamentos/${id}`);
};

const buscarMedicamentosPorNombre = (nombre: string) => {
  return api.get(`/medicamentos/buscar?nombre=${nombre}`);
};

const createMedicamento = (medicamentoDTO: MedicamentoDTO) => {
  return api.post('/medicamentos', medicamentoDTO);
};

const updateMedicamento = (id: number, medicamentoDTO: MedicamentoDTO) => {
  return api.put(`/medicamentos/${id}`, medicamentoDTO);
};

const deleteMedicamento = (id: number) => {
  return api.delete(`/medicamentos/${id}`);
};

const medicamentoService = {
  getAllMedicamentos,
  getMedicamentoById,
  buscarMedicamentosPorNombre,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento
};

export default medicamentoService;
