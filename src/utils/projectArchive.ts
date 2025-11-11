import JSZip from 'jszip';

export interface ProjectArchiveOptions {
  includeAssets?: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

interface ProjectWithMetadata {
  metadata?: Record<string, unknown>;
  audioFiles?: Array<{ id: string; path: string }>;
}

interface ProjectWithMetadata {
  metadata?: Record<string, unknown>;
  audioFiles?: Array<{ id: string; path: string }>;
}

export interface ProjectArchiveData<TProject = Record<string, unknown>> {
  project: TProject;
  audioFiles: Map<string, ArrayBuffer>;
}

export async function exportProjectArchive<
  TProject extends ProjectWithMetadata = ProjectWithMetadata
>(
  project: TProject,
  audioFiles: Map<string, Blob | ArrayBuffer>,
  options: ProjectArchiveOptions = {}
): Promise<Blob> {
  const { includeAssets = true, onProgress, onError } = options;

  try {
    onProgress?.(0.1);

    const zip = new JSZip();

    const exportedMetadata: Record<string, unknown> = {
      ...(project.metadata ?? {}),
      exportedAt: new Date().toISOString(),
    };

    const projectData: Omit<TProject, 'metadata'> & {
      metadata: Record<string, unknown>;
    } = {
      ...(project as Omit<TProject, 'metadata'>),
      metadata: exportedMetadata,
    };

    zip.file('project.json', JSON.stringify(projectData, null, 2));

    onProgress?.(0.3);

    if (includeAssets && audioFiles.size > 0) {
      const assetsFolder = zip.folder('assets');

      if (assetsFolder) {
        let processed = 0;
        const total = audioFiles.size;

        for (const [fileId, fileData] of audioFiles.entries()) {
          const audioFilesList = project.audioFiles ?? [];
          const audioFile = audioFilesList.find((f) => f.id === fileId);
          if (audioFile) {
            const buffer =
              fileData instanceof Blob ? await fileData.arrayBuffer() : fileData;
            assetsFolder.file(audioFile.path, buffer);
          }

          processed++;
          onProgress?.(0.3 + (processed / total) * 0.5);
        }
      }
    }

    onProgress?.(0.9);

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    });

    onProgress?.(1.0);

    return zipBlob;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to export project');
    onError?.(err);
    throw err;
  }
}

export async function importProjectArchive<
  TProject extends ProjectWithMetadata = ProjectWithMetadata
>(
  archiveBlob: Blob,
  options: ProjectArchiveOptions = {}
): Promise<ProjectArchiveData<TProject>> {
  const { onProgress, onError } = options;

  try {
    onProgress?.(0.1);

    const zip = await JSZip.loadAsync(archiveBlob);

    onProgress?.(0.3);

    const projectFile = zip.file('project.json');
    if (!projectFile) {
      throw new Error('Invalid project archive: project.json not found');
    }

    const projectJson = await projectFile.async('string');
    const project = JSON.parse(projectJson) as TProject;

    onProgress?.(0.5);

    const audioFiles = new Map<string, ArrayBuffer>();
    const assetsFolder = zip.folder('assets');

    if (assetsFolder) {
      const assetFiles = Object.keys(zip.files).filter((path) =>
        path.startsWith('assets/')
      );

      let processed = 0;
      const total = assetFiles.length;

      for (const filePath of assetFiles) {
        const file = zip.file(filePath);
        if (file) {
          const assetName = filePath.replace('assets/', '');
          const audioFilesList = (project as ProjectWithMetadata).audioFiles ?? [];
          const audioFile = audioFilesList.find((f) => f.path === assetName);

          if (audioFile) {
            const buffer = await file.async('arraybuffer');
            audioFiles.set(audioFile.id, buffer);
          }
        }

        processed++;
        onProgress?.(0.5 + (processed / total) * 0.4);
      }
    }

    onProgress?.(1.0);

    return {
      project,
      audioFiles,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to import project');
    onError?.(err);
    throw err;
  }
}

export async function exportProjectJSON<
  TProject extends ProjectWithMetadata = ProjectWithMetadata
>(project: TProject): Promise<Blob> {
  const exportedMetadata: Record<string, unknown> = {
    ...(project.metadata ?? {}),
    exportedAt: new Date().toISOString(),
  };

  const projectData: Omit<TProject, 'metadata'> & {
    metadata: Record<string, unknown>;
  } = {
    ...(project as Omit<TProject, 'metadata'>),
    metadata: exportedMetadata,
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export async function importProjectJSON<TProject = Record<string, unknown>>(
  jsonBlob: Blob
): Promise<TProject> {
  const jsonString = await jsonBlob.text();
  const project = JSON.parse(jsonString) as TProject;
  return project;
}
