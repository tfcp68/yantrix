import { describe, expect, it, vitest, beforeEach } from 'vitest';
import { BasicDataSource } from '../src/DataSource';
import { uniqId } from '@yantrix/utils';

describe('BasicDataSource', () => {
    type TSampleType = Record<string, string>;
    const samplePacket: TSampleType = { foo: 'bar' };
    let sampleInstance: BasicDataSource;
    let setterLink: (d: TSampleType) => void;
    const sampleId = uniqId();
    const afterInitSpy = vitest.fn((id, setter) => {
        expect(id).toBe(sampleId);
        setterLink = setter
        setter(samplePacket);
        expect(sampleInstance.currentCycle).toBe(1);
        expect(sampleInstance.totalCycles).toBe(1);
        expect(sampleInstance.currentEpoch).toBe(1);
    })
    beforeEach(() => {
        vitest.restoreAllMocks();
        vitest.clearAllTimers();
        sampleInstance = new BasicDataSource({
            id: sampleId,
            afterInit: afterInitSpy
        });
        expect(sampleInstance.currentCycle).toBe(0);
        expect(sampleInstance.totalCycles).toBe(0);
        expect(sampleInstance.currentEpoch).toBe(1);
    });

    describe('constructor', () => {
        it ('passes a fixture id', () => {
            expect(sampleInstance.id).toBe(sampleId);
        })

        it('returns an instance of BasicDataSource', () => {
            expect(sampleInstance).toBeInstanceOf(BasicDataSource);
        });

        it('inherits passed id', () => {
            const id = uniqId();
            const testInstance = new BasicDataSource({ id });
            expect(testInstance.id).toBe(id);
        });


        it('has an id when created without a parameter', () => {
            const testInstance = new BasicDataSource({});
            expect(testInstance.id).toBeTruthy();
        });

        it('instance is active by default', () => {
            expect(sampleInstance.isActive()).toBe(true);
        });

        it('calls afterInit synchronously', () => {
            expect(afterInitSpy).toHaveBeenCalled();
        })
        it('passes a setterLink to afterInit', () => {
            expect(setterLink).toBeTypeOf('function');
        })
    });

    describe('start/stop', () => {
        it('start increases epoch and resets cycles', () => {
            const initialEpoch = sampleInstance.currentEpoch;
            //console.warn(sampleInstance, sampleInstance.currentEpoch, sampleInstance.currentCycle, sampleInstance.totalCycles)
            expect(sampleInstance.currentCycle).toBeGreaterThan(0);
            sampleInstance.start();
            expect(sampleInstance.currentEpoch).toBe(initialEpoch + 1);
            expect(sampleInstance.currentCycle).toBe(0);
            expect(sampleInstance.totalCycles).toBeGreaterThan(0);
        });

        it('start/stop should change is active', () => {
            sampleInstance.start();
            expect(sampleInstance.isActive()).toBe(true);
            sampleInstance.stop();
            expect(sampleInstance.isActive()).toBe(false);
        });
    });
});
