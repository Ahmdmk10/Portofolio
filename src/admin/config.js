// Field config per collection. Drives both the list and the editor form.
const STATUS = { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] }

export const COLLECTIONS = {
  coding: {
    label: 'Coding', titleKey: 'title', importable: true,
    blank: { title: '', year: String(new Date().getFullYear()), kind: '', tags: [], desc: '', link: '', cover: null, status: 'draft' },
    fields: [
      { name: 'title', label: 'Judul', type: 'text', required: true },
      { name: 'year', label: 'Tahun', type: 'text' },
      { name: 'kind', label: 'Jenis (mis. CLI System)', type: 'text' },
      { name: 'tags', label: 'Tag (pisahkan dengan koma)', type: 'tags' },
      { name: 'desc', label: 'Deskripsi', type: 'area' },
      { name: 'link', label: 'Link proyek (GitHub / demo)', type: 'url' },
      { name: 'cover', label: 'Cover', type: 'cover' },
      STATUS,
    ],
  },
  design: {
    label: 'Design', titleKey: 'title',
    blank: { title: '', year: String(new Date().getFullYear()), kind: '', tags: [], hue: 150, ratio: '1/1', cover: null, status: 'draft' },
    fields: [
      { name: 'title', label: 'Judul', type: 'text', required: true },
      { name: 'year', label: 'Tahun', type: 'text' },
      { name: 'kind', label: 'Jenis (mis. Poster)', type: 'text' },
      { name: 'tags', label: 'Tag (pisahkan dengan koma)', type: 'tags' },
      { name: 'ratio', label: 'Rasio gambar', type: 'select', options: ['1/1', '4/5', '5/4', '16/9', '3/4'] },
      { name: 'hue', label: 'Warna thumbnail generatif (0-360)', type: 'range', min: 0, max: 360 },
      { name: 'cover', label: 'Gambar karya', type: 'cover' },
      STATUS,
    ],
  },
  learning: {
    label: 'Learning', titleKey: 'topic',
    blank: { topic: '', note: '', stage: 'now', level: 0, status: 'draft' },
    fields: [
      { name: 'topic', label: 'Topik', type: 'text', required: true },
      { name: 'note', label: 'Catatan singkat', type: 'text' },
      { name: 'stage', label: 'Tahap', type: 'select', options: ['now', 'done', 'next'] },
      { name: 'level', label: 'Progres (%)', type: 'range', min: 0, max: 100 },
      STATUS,
    ],
  },
}
