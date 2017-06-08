// @flow

import type { Experiment } from './experiments';

type RestartState = {
  isRequired: boolean,
};

type InstalledExperiment = {
  active: boolean,
  addon_id: string,
  created: string,
  html_url: string,
  installDate: string,
  manuallyDisabled: boolean,
  thumbnail: string,
  title: string
};

export type InstalledExperiments = {
  [name: string]: InstalledExperiment
};

type AddonState = {
  hasAddon: any,
  installed: InstalledExperiments,
  installedLoaded: boolean,
  installedAddons: Array<string>,
  clientUUID: string,
  restart: RestartState
};

function defaultState(): AddonState {
  return {
    // Null means we are being rendered at build time, and can't know
    // if the client will have the add on or not yet
    hasAddon: null,
    installed: {},
    installedLoaded: false,
    installedAddons: [],
    clientUUID: '',
    restart: {
      isRequired: false
    }
  };
}

type SetHasAddonAction = {
  type: 'SET_HAS_ADDON',
  payload: boolean
};

type SetClientUUIDAction = {
  type: 'SET_CLIENT_UUID',
  payload: string
};

export type SetInstalledAction = {
  type: 'SET_INSTALLED',
  payload: {
    installed: InstalledExperiments,
    installedLoaded: boolean
  }
};

type SetInstalledAddonsAction = {
  type: 'SET_INSTALLED_ADDONS',
  payload: Array<string>
};

type ExperimentPayloadAction = {
  type: 'ENABLE_EXPERIMENT' | 'DISABLE_EXPERIMENT' | 'MANUALLY_ENABLE_EXPERIMENT' | 'MANUALLY_DISABLE_EXPERIMENT',
  payload: Experiment
};

type AddonActions = SetHasAddonAction | SetClientUUIDAction | SetInstalledAction | ExperimentPayloadAction;

function setHasAddon(
  state: AddonState,
  { payload: hasAddon }: SetHasAddonAction
): AddonState {
  return {
    ...state,
    hasAddon,
    installed: hasAddon ? state.installed : {}
  };
}

function setInstalled(
  state: AddonState,
  { payload: { installed, installedLoaded } }: SetInstalledAction
): AddonState {
  return {
    ...state,
    installed,
    installedLoaded
  };
}

function setInstalledAddons(
  state: AddonState,
  { payload: installedAddons }: SetInstalledAddonsAction
): AddonState {
  const newInstalled = {};
  const actuallyInstalledAddons = (installedAddons || []);
  for (const addonId of Object.keys(state.installed)) {
    const experiment = state.installed[addonId];
    if (actuallyInstalledAddons.indexOf(addonId) === -1) {
      newInstalled[addonId] = { manuallyDisabled: true, ...experiment };
    } else {
      newInstalled[addonId] = experiment;
    }
  }
  return {
    ...state,
    installed: newInstalled,
    installedAddons: actuallyInstalledAddons
  };
}

function setClientUuid(
  state: AddonState,
  { payload: clientUUID }: SetClientUUIDAction
): AddonState {
  return { ...state, clientUUID };
}

function manuallyEnableExperiment(
  state: AddonState,
  { payload: experiment }: ExperimentPayloadAction
): AddonState {
  const newInstalled = { ...state.installed };
  newInstalled[experiment.addon_id] = { manuallyDisabled: false, ...experiment };
  return { ...state, installed: newInstalled };
}

function manuallyDisableExperiment(
  state: AddonState,
  { payload: experiment }: ExperimentPayloadAction
): AddonState {
  const newInstalled = { ...state.installed };
  newInstalled[experiment.addon_id] = { manuallyDisabled: true, ...experiment };
  return { ...state, installed: newInstalled };
}

function enableExperiment(
  state: AddonState,
  { payload: experiment }: ExperimentPayloadAction
): AddonState {
  const newInstalled = { ...state.installed };
  newInstalled[experiment.addon_id] = experiment;
  return { ...state, installed: newInstalled };
}

function disableExperiment(
  state: AddonState,
  { payload: experiment }: ExperimentPayloadAction
): AddonState {
  const newInstalled = { ...state.installed };
  delete newInstalled[experiment.addon_id];
  return { ...state, installed: newInstalled };
}

function requireRestart(state: AddonState): AddonState {
  return {
    ...state,
    restart: {
      isRequired: true
    }
  };
}

export function getInstalled(state: AddonState): InstalledExperiments {
  return state.installed;
}

export function isExperimentEnabled(state: AddonState, experiment: Experiment) {
  return !!(
    experiment && experiment.addon_id in state.installed &&
    !state.installed[experiment.addon_id].manuallyDisabled);
}

export function isAfterCompletedDate(experiment: Experiment) {
  return ((new Date(experiment.completed)).getTime() < Date.now());
}

export function isInstalledLoaded(state: AddonState) {
  return state.installedLoaded;
}

export default function addonReducer(state: ?AddonState, action: AddonActions): AddonState {
  if (!state) {
    return defaultState();
  }

  switch (action.type) {
    case 'SET_HAS_ADDON':
      return setHasAddon(state, action);
    case 'SET_INSTALLED':
      return setInstalled(state, action);
    case 'SET_INSTALLED_ADDONS':
      return setInstalledAddons(state, action);
    case 'SET_CLIENT_UUID':
      return setClientUuid(state, action);
    case 'ENABLE_EXPERIMENT':
      return enableExperiment(state, action);
    case 'DISABLE_EXPERIMENT':
      return disableExperiment(state, action);
    case 'MANUALLY_ENABLE_EXPERIMENT':
      return manuallyEnableExperiment(state, action);
    case 'MANUALLY_DISABLE_EXPERIMENT':
      return manuallyDisableExperiment(state, action);
    case 'REQUIRE_RESTART':
      return requireRestart(state);
    default:
      return state;
  }
}
