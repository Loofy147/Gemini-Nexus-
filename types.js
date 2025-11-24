"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCapability = exports.SwarmState = exports.AgentStatus = void 0;
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["QUEUED"] = "QUEUED";
    AgentStatus["BLOCKED"] = "BLOCKED";
    AgentStatus["THINKING"] = "THINKING";
    AgentStatus["WORKING"] = "WORKING";
    AgentStatus["AWAITING_INPUT"] = "AWAITING_INPUT";
    AgentStatus["VERIFYING"] = "VERIFYING";
    AgentStatus["HEALING"] = "HEALING";
    AgentStatus["COMPLETED"] = "COMPLETED";
    AgentStatus["FAILED"] = "FAILED";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var SwarmState;
(function (SwarmState) {
    SwarmState["IDLE"] = "IDLE";
    SwarmState["ORCHESTRATING"] = "ORCHESTRATING";
    SwarmState["EXECUTING"] = "EXECUTING";
    SwarmState["PAUSED"] = "PAUSED";
    SwarmState["SYNTHESIZING"] = "SYNTHESIZING";
    SwarmState["COMPLETED"] = "COMPLETED";
    SwarmState["ERROR"] = "ERROR";
})(SwarmState || (exports.SwarmState = SwarmState = {}));
var AgentCapability;
(function (AgentCapability) {
    AgentCapability["RESEARCH"] = "RESEARCH";
    AgentCapability["ANALYSIS"] = "ANALYSIS";
    AgentCapability["CREATIVE"] = "CREATIVE";
    AgentCapability["CODING"] = "CODING";
    AgentCapability["FAST_TASK"] = "FAST_TASK";
})(AgentCapability || (exports.AgentCapability = AgentCapability = {}));
