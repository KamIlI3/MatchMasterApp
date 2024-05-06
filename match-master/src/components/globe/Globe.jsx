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
    this.camera.position.set(0, 0, 20); // Przesunięcie kamery do tyłu
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
  // Przetwórz dane granic krajów i dodaj do sceny
  const geoJsonFeatures = countriesData.features;
  const countryBordersGroup = new THREE.Group();

  geoJsonFeatures.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    coordinates.forEach(polygon => {
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff }); // Materiał linii granic kraju

      // Przeskaluj i przesuń współrzędne granic kraju
      const scaledPoints = polygon.map(point => {
        // Przekształć współrzędne geograficzne na współrzędne sferyczne
        const phi = (90 - point[1]) * (Math.PI / 180);
        const theta = -(point[0] + 180) * (Math.PI / 180); // Zmiana znaku dla theta
    
        // Przesunięcie granic
        const offsetX = 0; // Przesunięcie w osi X
        const offsetY = 0; // Przesunięcie w osi Y
        const offsetZ = 0; // Przesunięcie w osi Z
    
        // Przekształć współrzędne sferyczne na współrzędne kartezjańskie i dodaj przesunięcie
        const x = Math.sin(phi) * Math.cos(theta) + offsetX;
        const y = Math.cos(phi) + offsetY;
        const z = Math.sin(phi) * Math.sin(theta) + offsetZ;
    
        return new THREE.Vector3(x, y, z).multiplyScalar(10); // Skalowanie do promienia globusa
      });

      // Utwórz geometrię linii granic kraju
      const geometry = new THREE.BufferGeometry().setFromPoints(scaledPoints);
      const line = new THREE.Line(geometry, lineMaterial); // Utwórz obiekt linii granic kraju

      countryBordersGroup.add(line); // Dodaj linie granic kraju do grupy
    });
  });

  this.scene.add(countryBordersGroup); // Dodaj grupę granic krajów do sceny
  
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
  this.lastHighlightedBorder = null; // Przenieś deklarację zmiennej do konstruktora klasy
}

onMouseMove = (event) => {
  event.preventDefault();

  // Pobierz pozycję myszy na ekranie
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1.05;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 0.95;

  // Stwórz raycaster
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, this.camera);

  // Sprawdź kolizję z obiektami granic kraju
  const intersects = raycaster.intersectObjects(this.scene.children, true);

  // Inicjalizuj zmienną dla aktualnie podświetlonej granicy
  let highlightedBorder = null;

  // Jeśli mysz najechała na granicę kraju, znajdź aktualnie podświetloną granicę
  if (intersects.length > 0) {
    intersects.forEach(intersect => {
      if (intersect.object.type === 'Line') {
        intersect.object.material.color.set(0x00ff00); // Ustaw kolor na zielony
        highlightedBorder = intersect.object; // Przypisz aktualnie podświetloną granicę
      }
    });
  }

  // Jeśli aktualnie podświetlona granica jest różna od poprzedniej, wyłącz podświetlenie poprzedniej granicy
  if (highlightedBorder !== this.lastHighlightedBorder) {
    if (this.lastHighlightedBorder) {
      this.lastHighlightedBorder.material.color.set(0xffffff); // Przywróć pierwotny kolor poprzedniej granicy
    }
    this.lastHighlightedBorder = highlightedBorder; // Zapisz aktualnie podświetloną granicę
  }
}

resetBordersColor = () => {
  this.scene.traverse((child) => {
      if (child.type === 'Line') {
          child.material.color.set(0xffffff); // Przywróć pierwotny kolor
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
