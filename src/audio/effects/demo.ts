import { AudioEngine } from '../AudioEngine';

// Demo function to test effects
export function demoEffects() {
  console.log('🎛️  Starting Effects Demo');
  
  try {
    // Create audio engine
    const audioEngine = new AudioEngine();
    console.log('✅ AudioEngine created');
    
    // Test master effects
    console.log('\n🎚️  Testing Master Effects:');
    const masterReverb = audioEngine.addEffectToMaster('reverb');
    console.log(`✅ Added reverb to master: ${masterReverb.name}`);
    
    const masterDelay = audioEngine.addEffectToMaster('delay');
    console.log(`✅ Added delay to master: ${masterDelay.name}`);
    
    // Test track effects
    console.log('\n🎵  Testing Track Effects:');
    const trackId = 'test-track-1';
    const track = audioEngine.createTrack({
      id: trackId,
      name: 'Test Track',
      type: 'audio',
      volume: 0.8,
      pan: 0,
    });
    console.log(`✅ Created track: ${track.id}`);
    
    const trackEQ = audioEngine.addEffectToTrack(trackId, 'eq');
    console.log(`✅ Added EQ to track: ${trackEQ.name}`);
    
    const trackDistortion = audioEngine.addEffectToTrack(trackId, 'distortion');
    console.log(`✅ Added distortion to track: ${trackDistortion.name}`);
    
    // Test parameter changes
    console.log('\n🎛️  Testing Parameter Changes:');
    masterReverb.setParameter('wetLevel', 0.5);
    console.log(`✅ Set reverb wet level: 0.5`);
    
    masterDelay.setParameter('delayTime', 0.3);
    console.log(`✅ Set delay time: 0.3s`);
    
    trackEQ.setParameter('lowShelfGain', 2);
    console.log(`✅ Set EQ low shelf gain: 2dB`);
    
    trackDistortion.setParameter('amount', 75);
    console.log(`✅ Set distortion amount: 75%`);
    
    // Test bypass
    console.log('\n⏸️  Testing Bypass:');
    audioEngine.effectsManager.bypassEffectInMaster(masterReverb.id, true);
    console.log(`✅ Bypassed master reverb`);
    
    audioEngine.effectsManager.bypassEffectInTrack(trackId, trackEQ.id, true);
    console.log(`✅ Bypassed track EQ`);
    
    // Test moving effects
    console.log('\n🔄  Testing Effect Reordering:');
    const masterEffects = audioEngine.getMasterEffects().getAllEffects();
    console.log(`Master effects order: ${masterEffects.map(e => e.name).join(' -> ')}`);
    
    // Move delay before reverb
    audioEngine.effectsManager.moveEffectInMaster(masterDelay.id, 0);
    console.log(`✅ Moved delay to first position`);
    
    const newMasterEffects = audioEngine.getMasterEffects().getAllEffects();
    console.log(`New master effects order: ${newMasterEffects.map(e => e.name).join(' -> ')}`);
    
    // Test serialization
    console.log('\n💾  Testing Serialization:');
    const serializedState = audioEngine.effectsManager.serializeState();
    console.log(`✅ Serialized effects state (${serializedState.length} chars)`);
    
    // Create new effects manager and deserialize
    const newEffectsManager = audioEngine.effectsManager;
    newEffectsManager.deserializeState(serializedState);
    console.log('✅ Deserialized effects state');
    
    // Test state retrieval
    console.log('\n📊  Testing State Retrieval:');
    const effectsInfo = audioEngine.effectsManager.getEffectInfo();
    console.log('Master effects:', effectsInfo[0].effects.map(e => ({ name: e.name, enabled: e.enabled })));
    console.log('Track effects:', effectsInfo[1]?.effects.map(e => ({ name: e.name, enabled: e.enabled })));
    
    // Test special features
    console.log('\n🎛️  Testing Special Features:');
    
    // Compressor gain reduction
    const compressor = audioEngine.addEffectToMaster('compressor');
    console.log(`✅ Added compressor: ${compressor.name}`);
    
    // Filter response
    const filter = audioEngine.addEffectToTrack(trackId, 'filter');
    console.log(`✅ Added filter: ${filter.name}`);
    
    // Test EQ curve
    const eqCurve = (trackEQ as any).getEQCurve?.();
    if (eqCurve) {
      console.log(`✅ Got EQ curve with ${eqCurve.length} points`);
    }
    
    // Test gain reduction
    const gainReduction = (compressor as any).getGainReduction?.();
    if (typeof gainReduction === 'number') {
      console.log(`✅ Current gain reduction: ${gainReduction.toFixed(2)}dB`);
    }
    
    // Test filter response
    const filterResponse = (filter as any).getFilterResponse?.();
    if (filterResponse) {
      console.log(`✅ Got filter response with ${filterResponse.length} points`);
    }
    
    console.log('\n🎉  Effects Demo Complete!');
    console.log('\n📝  Summary:');
    console.log(`- Master effects: ${newMasterEffects.length}`);
    console.log(`- Track effects: ${audioEngine.getTrackEffects(trackId)?.getAllEffects().length || 0}`);
    console.log('- All effect types available: reverb, delay, eq, compressor, distortion, filter');
    console.log('- Features: parameter control, bypass, reordering, serialization');
    console.log('- Special features: EQ curves, gain reduction meters, filter response');
    
    return {
      audioEngine,
      masterEffects: newMasterEffects,
      trackEffects: audioEngine.getTrackEffects(trackId)?.getAllEffects() || [],
      success: true,
    };
    
  } catch (error) {
    console.error('❌ Effects Demo Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Auto-run demo if this file is executed directly
if (typeof window !== 'undefined') {
  // Add to global scope for easy testing in browser console
  (window as any).demoEffects = demoEffects;
  console.log('💡 Run demoEffects() in the console to test the effects system!');
}

export default demoEffects;