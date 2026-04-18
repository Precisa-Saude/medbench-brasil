import { useParams } from 'react-router-dom';

export default function EditionDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-sans font-bold">Edição {id}</h1>
      <p className="text-muted-foreground">
        Página de detalhe por edição — gráfico de três linhas (nota de corte, média humana estimada,
        escores dos modelos) será implementado quando os primeiros resultados forem publicados.
      </p>
    </div>
  );
}
