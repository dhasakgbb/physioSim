import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { ActiveMixture } from './components/active-mixture/active-mixture';
import { SimulationChart } from './components/simulation-chart/simulation-chart';
import { TelemetryHud } from './components/telemetry-hud/telemetry-hud';

@NgModule({
  declarations: [
    App,
    ActiveMixture,
    SimulationChart,
    TelemetryHud
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
