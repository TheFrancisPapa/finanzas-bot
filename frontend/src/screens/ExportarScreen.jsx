import React from 'react';
import Header from '../components/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { exportarExcelUrl } from '../lib/api';

const ExportarScreen = ({ onNavigate }) => {
  const handleExport = () => {
    window.open(exportarExcelUrl(), '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] theme-transition pb-12 animate-in fade-in duration-500">
      <Header onNavigate={() => onNavigate('more')} title="Exportar Datos" backButton />
      <main className="px-6 mt-8 space-y-6">
        <Card className="!p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-black text-[var(--text-main)] mb-3 tracking-tight">Exportar a Excel</h3>
          <p className="text-[var(--text-muted)] font-medium mb-6">Descargá todos tus movimientos en un archivo Excel para tu contador o análisis personal.</p>
          <Button onClick={handleExport} className="py-4">
            📥 Descargar Excel
          </Button>
          <p className="text-xs text-[var(--text-muted)] mt-4 font-bold">Requiere cuenta PRO activa</p>
        </Card>
      </main>
    </div>
  );
};

export default ExportarScreen;
