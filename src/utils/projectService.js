import { supabase } from './supabase';

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, drawings(id), io_points(id)')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map(p => ({
    ...p,
    drawingCount: p.drawings?.length || 0,
    ioCount: p.io_points?.length || 0,
  }));
}

export async function createProject({ name, client, description }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, client: client || null, description: description || null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Project Detail ──────────────────────────────────────────────────────────

export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getProjectDrawings(projectId) {
  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .eq('project_id', projectId)
    .order('analyzed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getProjectIOPoints(projectId) {
  const { data, error } = await supabase
    .from('io_points')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Save Analysis Results ───────────────────────────────────────────────────

export async function saveResultsToProject(projectId, filename, instruments) {
  // 1. Create drawing record
  const { data: drawing, error: drawingError } = await supabase
    .from('drawings')
    .insert({
      project_id: projectId,
      filename,
      io_count: instruments.length,
    })
    .select()
    .single();

  if (drawingError) throw new Error(drawingError.message);

  // 2. Insert all io_points
  const ioRows = instruments.map(inst => ({
    project_id: projectId,
    drawing_id: drawing.id,
    tag: inst.tag,
    signal_type: inst.signalType,
    description: inst.description,
    location: inst.location || '',
    equipment: inst.equipment || '',
    equipment_id: inst.equipmentId || '',
    is_alarm: inst.isAlarm || false,
    source_file: filename,
  }));

  const { error: ioError } = await supabase.from('io_points').insert(ioRows);
  if (ioError) throw new Error(ioError.message);

  // 3. Update project updated_at
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId);

  return drawing;
}

export async function deleteDrawing(drawingId) {
  const { error } = await supabase
    .from('drawings')
    .delete()
    .eq('id', drawingId);

  if (error) throw new Error(error.message);
}
