import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Greeter', function () {
  it('stores and updates greeting', async function () {
    const Greeter = await ethers.getContractFactory('Greeter');
    const greeter = await Greeter.deploy('hello');
    await greeter.waitForDeployment();

    expect(await greeter.greet()).to.equal('hello');
    await greeter.setGreeting('gm');
    expect(await greeter.greet()).to.equal('gm');
  });
});
