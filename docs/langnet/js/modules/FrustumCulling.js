// utilidades para frustum culling de clusters de nodos

export class FrustumCulling {
    constructor() {
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.boundingSphere = new THREE.Sphere();
        this.tempVector = new THREE.Vector3();
    }

    updateFrustum(camera) {
        this.projScreenMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    // calcula bounding sphere para un conjunto de posiciones
    calculateBoundingSphere(positions) {
        if (!positions || positions.length === 0) {
            return null;
        }

        const center = new THREE.Vector3();
        
        // calcular centro promedio
        for (const pos of positions) {
            center.x += pos.x;
            center.y += pos.y;
            center.z += pos.z;
        }
        center.divideScalar(positions.length);

        // calcular radio máximo desde el centro
        let maxRadius = 0;
        for (const pos of positions) {
            const dist = center.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z));
            if (dist > maxRadius) {
                maxRadius = dist;
            }
        }

        // agregar margen de seguridad (tamaño de esfera + margen)
        maxRadius += 1.5;
        
        return new THREE.Sphere(center, maxRadius);
    }

    // verifica si un cluster es visible
    isClusterVisible(clusterBoundingSphere) {
        if (!clusterBoundingSphere) {
            return true;
        }
        return this.frustum.intersectsSphere(clusterBoundingSphere);
    }

    // verifica si un punto individual es visible
    isPointVisible(position) {
        if (!position) {
            return false;
        }
        this.tempVector.set(position.x, position.y, position.z);
        return this.frustum.containsPoint(this.tempVector);
    }

    // calcula bounding spheres para cada grupo de color
    calculateClusterBoundingSpheres(instancedNodes, currentLayout) {
        const clusterBounds = new Map();

        instancedNodes.forEach((nodeGroup, color) => {
            const { languages } = nodeGroup;
            const positions = [];

            languages.forEach((langData) => {
                const pos = currentLayout[langData.index];
                if (pos) {
                    positions.push(pos);
                }
            });

            if (positions.length > 0) {
                const boundingSphere = this.calculateBoundingSphere(positions);
                clusterBounds.set(color, boundingSphere);
            }
        });

        return clusterBounds;
    }
}
