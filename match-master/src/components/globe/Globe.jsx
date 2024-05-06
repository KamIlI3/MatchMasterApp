import React, {Component} from 'react'
import styles from './Globe.module.css';

import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

import earthmap from '../../assets/images/earthmap4k.jpg'
import earthbump from '../../assets/images/earthbump4k.jpg'
import earthspec from '../../assets/images/earthspec4k.jpg'

import space_right from '../../assets/images/space_right.png'
import space_left from '../../assets/images/space_left.png'
import space_top from '../../assets/images/space_top.png'
import space_back from '../../assets/images/space_back.png'
import space_front from '../../assets/images/space_front.png'
import space_bot from '../../assets/images/space_bot.png'

import countriesData from './countries.geo.json';


class Globe extends Component{

  componentDidMount(){
    this.createScene();
    this.startAnimation();

    window.addEventListener('resize', this.handleWindowResize)
  }

  createScene = () => {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.controls = new OrbitControls(this.camera, this.mount);
    this.controls.enableZoom = true;

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.appendChild(this.renderer.domElement);
    this.camera.position.z = 20;
    this.camera.position.set(0, 0, 20); 
    this.camera.lookAt(0, 0, 0);

    this.addEarth();
    this.addSkyBox();
    this.addSunLight();
    this.addCountryBorders();
  }

  addEarth = () => {
    const earthMap = new THREE.TextureLoader().load( earthmap );
    const earthBumpMap = new THREE.TextureLoader().load( earthbump );
    const earthSpecMap = new THREE.TextureLoader().load( earthspec );

    const earthGeometry = new THREE.SphereGeometry( 10, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthMap,
        bumpMap: earthBumpMap,
        bumpScale: 0.10,
        specularMap: earthSpecMap,
        specular: new THREE.Color('gray')
    });

    this.earthSphere = new THREE.Mesh( earthGeometry, earthMaterial );
    this.earthSphere.name = "EarthSphere";
    this.scene.add(this.earthSphere);
  }

addSkyBox = () => {
    const skyBox = new THREE.CubeTextureLoader().load([
        space_right,
        space_left,
        space_top,
        space_bot,
        space_front,
        space_back,
    ]);
    this.scene.background = skyBox;
}

addCountryBorders = () => {
  const geoJsonFeatures = countriesData.features;
  const countryBordersGroup = new THREE.Group();

  geoJsonFeatures.forEach(feature => {
    const geometries = feature.geometry.type === 'MultiPolygon' ?
      feature.geometry.coordinates :
      [feature.geometry.coordinates];

    geometries.forEach(coordinates => {
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      
      const scaledPoints = coordinates.map(polygon => polygon.map(point => {
        const phi = (90 - point[1]) * (Math.PI / 180);
        const theta = -(point[0] + 180) * (Math.PI / 180);
    
        const offsetX = 0;
        const offsetY = 0;
        const offsetZ = 0;
    
        const x = Math.sin(phi) * Math.cos(theta) + offsetX;
        const y = Math.cos(phi) + offsetY;
        const z = Math.sin(phi) * Math.sin(theta) + offsetZ;
    
        return new THREE.Vector3(x, y, z).multiplyScalar(10);
      })).flat();
      
      const geometry = new THREE.BufferGeometry().setFromPoints(scaledPoints);
      const line = new THREE.Line(geometry, lineMaterial);
      
      countryBordersGroup.add(line);
    });
  });

  this.scene.add(countryBordersGroup);

  this.rotateCountryBorders = (angleX, angleY, angleZ) => {
    countryBordersGroup.rotation.x += angleX;
    countryBordersGroup.rotation.y += angleY;
    countryBordersGroup.rotation.z += angleZ;
  }
  this.rotateCountryBorders(0, 3.14, 0);

  this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);
}


constructor() {
  super();
  this.lastHighlightedBorder = null; 
}



onMouseMove = (event) => {
  event.preventDefault();

  const rect = this.renderer.domElement.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const mouse = new THREE.Vector2();
  mouse.x = (mouseX / rect.width) * 2 - 1;
  mouse.y = - (mouseY / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, this.camera);

  raycaster.params.Line.threshold = 0.1;

  const intersects = raycaster.intersectObjects(this.scene.children, true);

  let highlightedBorder = null;

  if (intersects.length > 0) {
    intersects.forEach(intersect => {
      if (intersect.object.type === 'Line') {
        intersect.object.material.color.set(0x00ff00);
        highlightedBorder = intersect.object;
      }
    });
  }

  if (highlightedBorder !== this.lastHighlightedBorder) {
    if (this.lastHighlightedBorder) {
      this.lastHighlightedBorder.material.color.set(0xffffff);
    }
    this.lastHighlightedBorder = highlightedBorder;
  }
}



resetBordersColor = () => {
  this.scene.traverse((child) => {
      if (child.type === 'Line') {
          child.material.color.set(0xffffff);
      }
  });
}


addSunLight = () => {
    const sunLights =  [];
    sunLights[0] = new THREE.DirectionalLight(0xffffff, 1);
    sunLights[1] = new THREE.DirectionalLight(0xffffff, 1);
    sunLights[2] = new THREE.DirectionalLight(0xffffff, 1);
    sunLights[3] = new THREE.DirectionalLight(0xffffff, 1);
    sunLights[4] = new THREE.DirectionalLight(0xffffff, 1);
    sunLights[5] = new THREE.DirectionalLight(0xffffff, 1);

    sunLights[0].position.set(0, 0, 1);
    sunLights[1].position.set(0, 0, -1); 
    sunLights[2].position.set(0, 1, 0);
    sunLights[3].position.set(0, -1, 0); 
    sunLights[4].position.set(1, 0, 0);
    sunLights[5].position.set(-1, 0, 0); 

    this.scene.add(sunLights[0]); 
    this.scene.add(sunLights[1]);
    this.scene.add(sunLights[2]); 
    this.scene.add(sunLights[3]);
    this.scene.add(sunLights[4]); 
    this.scene.add(sunLights[5]);
}

  startAnimation = () => {
    this.requestID = window.requestAnimationFrame(this.startAnimation);
    this.controls.update();
    this.renderer.render( this.scene, this.camera);
  }

  handleWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    }

  render(){
    return(
      <div
        ref={ref => (this.mount = ref)}>
      </div>
    )
  }
}

export default Globe;
