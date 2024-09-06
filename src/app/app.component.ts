import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(private metaService: Meta, private titleService: Title) {}
  title = 'capaupv';

  ngOnInit() {
    this.titleService.setTitle('Horario de clases de la UPV/EHU | Tu App');
    this.metaService.updateTag({ name: 'description', content: 'Consulta tus horarios de la UPV/EHU con el mejor sistema.' });
    this.metaService.updateTag({ name: 'keywords', content: 'medicina, horarios, clases, organización, estudiantes' });
  }
}
