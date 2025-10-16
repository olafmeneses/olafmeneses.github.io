// LangNet Config

export const CONFIG = {
    DATA_PATHS: {
        GRAPH: 'data/graph',
        TSNE: 'data/tsne.csv',
        MDS: 'data/mds.csv',
        COLORS: 'data/color_mapping_g1.csv'
    },
    PERFORMANCE: {
        SPHERE_SEGMENTS: 6,
        SPHERE_SEGMENTS_SMOOTH: 24,
        PIXEL_RATIO_LIMIT: 1.5
    },
    CAMERA: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 5000,
        INITIAL_POSITION: { x: 0, y: 50, z: 200 }
    }
};