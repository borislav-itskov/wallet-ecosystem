import { CodeBlock, CodeBlockWithHightlight } from '@/components/CodeBlock';
import Figure from '@/components/Figure';
import Title from '@/components/Title';
import Link from 'next/link';
import React from 'react';

export default function ClaveSecurityAnalysis() {
  return (
    <div className="flex flex-col gap-2">
      <Title level={4}>Key Management</Title>
      <Figure src="/wallets/clave/clave_key_management.jpeg" />

      <Title level={5}>Responsibility</Title>
      <p>
        A single user is responsible for managing the private key (
        <code>secp256r1</code>
        passkey in this case).
      </p>

      <Title level={5}>Storage</Title>
      <p>
        The passkey is generated by the device’s Secure Enclave (in case of iOS
        devices) or similar modules (in case of Android devices). The passkey is
        locally stored on the device’s Secure Enclave (in case of iOS devices)
        or similar modules (in case of Android devices).
      </p>

      <Title level={5}>Access</Title>
      <p>
        The user can access Secure Enclave (in case of iOS devices) or similar
        modules (in case of Android devices) in order to perform different
        operations without the passkey ever leaving the Secure Enclave.
      </p>

      <Title level={4}>Account Management</Title>
      <p>
        Clave does not support Externally Owned Accounts (EOAs) but it does
        support Smart Contract Accounts (SCAs).
      </p>

      <Title level={5}>Clave’s SCA Implementation</Title>
      <p>
        Clave maintains their own{' '}
        <a href="https://github.com/getclave/clave-contracts" target="_blank">
          SCA implementation
        </a>
        .
      </p>

      <Title level={5}>Registry</Title>
      <p>
        Clave maintains their own and{' '}
        <a
          href="https://github.com/getclave/clave-contracts/blob/master/contracts/managers/ModuleManager.sol"
          target="_blank"
        >
          ModuleManager
        </a>{' '}
        and{' '}
        <a
          href="https://github.com/getclave/clave-contracts/blob/master/contracts/managers/HookManager.sol"
          target="_blank"
        >
          HookManager
        </a>
        .
      </p>

      <Title level={5}>Modules</Title>
      <p>
        Clave also has 2 module implementations:{' '}
        <a
          href="https://github.com/getclave/clave-contracts/blob/master/contracts/modules/recovery/SocialRecoveryModule.sol"
          target="_blank"
        >
          SocialRecoveryModule
        </a>{' '}
        and{' '}
        <a
          href="https://github.com/getclave/clave-contracts/blob/master/contracts/modules/recovery/CloudRecoveryModule.sol"
          target="_blank"
        >
          CloudRecoveryModule
        </a>
        .
      </p>

      <ul className="list-disc px-4">
        <li>
          <b>
            <a
              href="https://github.com/getclave/clave-contracts/blob/master/contracts/modules/recovery/SocialRecoveryModule.sol"
              target="_blank"
            >
              SocialRecoveryModule
            </a>
          </b>
          : The Social recovery module allows clave users to assign guardians to
          their account who can help recovery your wallet.
          <CodeBlock
            code={`struct RecoveryConfig {
  uint128 timelock; // Recovery timelock duration
  uint128 threshold; // Recovery threshold
  address[] guardians; // Guardian addresses
}`}
            language="typescript"
          />
          <p>
            Each account has a <code>RecoveryConfig</code> which defines:
          </p>
          <ol className="list-decimal px-4">
            <li>
              <code>timelock</code> defines the duration of the recovery period
              (see recovery section for more context).
            </li>
            <li>
              <code>threshold</code> defines the minimum number of guardians
              that need to approve the recovery of an account. Note that the{' '}
              <code>threshold</code> will always be less than or equal to the
              number of <code>guardians</code> associated with the account.
            </li>
            <li>
              <code>guardians</code> is an array of guardian addresses
              associated with an account.
            </li>
          </ol>
          <p>
            We’ll discuss how this module is used for recovery in this section.
          </p>
        </li>
        <li>
          <b>
            <a
              href="https://github.com/getclave/clave-contracts/blob/master/contracts/modules/recovery/CloudRecoveryModule.sol"
              target="_blank"
            >
              CloudRecoveryModule
            </a>
          </b>
          : The cloud recovery module recovers an account using a key stored in
          iCloud or other similar clouds.{' '}
          <b>
            This module is no longer used in the current Clave app because
            passkeys can sync with different user devices.
          </b>
        </li>
      </ul>

      <Title level={4}>Processes</Title>
      <p>Clave has the following processes in place:</p>

      <Title level={5}>Key Generation</Title>
      <ol className="list-decimal px-4">
        <li>
          User (mobile wallet) receives a challenge string the Clave server.
          This challenge string is then used as an input (
          <code>bytes32 salt</code>) to generate the (counterfactual) account
          address (using the
          <a
            href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/AccountFactory.sol#L129C14-L129C31"
            target="_blank"
          >
            {' '}
            getAddressForSalt
          </a>{' '}
          function). A counterfactual account address means that the actual
          smart contract account is not deployed on the address yet, but if we
          use the same salt (challenge string) to deploy a smart contract
          account (using the{' '}
          <a
            href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/AccountFactory.sol#L60"
            target="_blank"
          >
            {' '}
            deployAccount{' '}
          </a>{' '}
          function), it’ll be deployed to the same address that was generated by
          the{' '}
          <a
            href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/AccountFactory.sol#L129C14-L129C31"
            target="_blank"
          >
            {' '}
            getAddressForSalt
          </a>{' '}
          function.
        </li>
        <li>
          <p>
            Once the user has the counterfactual account address, we’ll generate
            a key pair. In order to do so, we’ll first need to create a{' '}
            <code>publicKeyCredentialCreationOptions</code> object.
          </p>
          <p>
            Here is an example (actual implementation might differ) of how the{' '}
            <code>publicKeyCredentialCreationOptions</code> object looks like:
          </p>
          <ul className="list-disc px-4">
            <li>
              <code>challenge</code> parameter is generated using the challenge
              string that we got from the Clave server (which is{' '}
              <code>randomStringFromServer</code> in the code snippet). This is
              used to prevent “replay attacks” (more info{' '}
              <a
                href="https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-challenge"
                target="_blank"
              >
                {' '}
                here
              </a>
              ).
            </li>
            <li>
              <code>rp</code> which is also known as the relaying party
              basically defines the describing the organization responsible for
              registering and authenticating the user. In this case, it’s Clave!
              (more info
              <a
                href="https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-rp"
                target="_blank"
              >
                {' '}
                here
              </a>
              ).
            </li>
            <li>
              <code>user</code> defines the user currently registering. The
              counterfactual account address is used as the <code>id</code>{' '}
              parameter. It is suggested to not use personally identifying
              information as the <code>id</code>, as it may be stored in an
              authenticator. 
              <a
                href="https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-user"
                target="_blank"
              >
                {' '}
                Read the spec
              </a>{' '}
              (more info
              <a
                href="https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-rp"
                target="_blank"
              >
                {' '}
                here
              </a>
              ).
            </li>
            <li>
              <code>pubKeyCredParams</code> describes what public key types (in
              this case, <code>secp256r1</code>) are acceptable to a server
              (Clave).
            </li>
          </ul>

          <p>
            Rest of the params are optionally filled and are same for every
            user.
          </p>
          <CodeBlock
            code={`const publicKeyCredentialCreationOptions = {
  challenge: Uint8Array.from(
      randomStringFromServer, c => c.charCodeAt(0)),
  rp: {
      name: "Clave wallet",
      id: "getclave.io",
  },
  user: {
      id: Uint8Array.from(
          "UZSL85T9AFC", c => c.charCodeAt(0)),
      name: "vasa.develop@gmail.com",
      displayName: "vasa",
  },
  pubKeyCredParams: [{alg: -7, type: "public-key"}],
  authenticatorSelection: {
      authenticatorAttachment: "cross-platform",
  },
  timeout: 60000,
  attestation: "direct"
};`}
            language="typescript"
          />
        </li>
        <li>
          <p>
            Once we have the <code>publicKeyCredentialCreationOptions</code>, we
            use the{' '}
            <a
              href="https://github.com/getclave/clave-rn-passkey?tab=readme-ov-file#creating-a-new-passkey"
              target="_blank"
            >
              register function
            </a>{' '}
            to get a <code>PasskeyRegistrationResult</code> object. This
            <code>PasskeyRegistrationResult</code> object is then sent to the
            clave server to be parsed and validated. Note that under the hood,
            the{' '}
            <a
              href="https://github.com/getclave/clave-rn-passkey?tab=readme-ov-file#creating-a-new-passkey"
              target="_blank"
            >
              register function
            </a>{' '}
            generates a key pair; the private key is stored in the secure
            enclave and never leaves the enclave, whereas the public key can be
            shared publicly.
          </p>
          <CodeBlockWithHightlight
            code={`import { Passkey, PasskeyRegistrationResult } from 'react-native-passkey';

// Retrieve a valid FIDO2 attestation request from your server
// The challenge inside the request needs to be a base64 encoded string
// There are plenty of libraries which can be used for this (e.g. fido2-lib)

try {
  // Call the \`register\` method with the retrieved request in JSON format
  // A native overlay will be displayed
  const result: PasskeyRegistrationResult = await Passkey.register(requestJson);

  // The \`register\` method returns a FIDO2 attestation result
  // Pass it to your server for verification
  
  console.log(result);
  
  // PasskeyRegistrationResult {
  //   id: 'ADSUllKQmbqdGtpu4sjseh4cg2TxSvrbcHDTBsv4NSSX9...',
  //   rawId: ArrayBuffer(59),
  //   response: AuthenticatorAttestationResponse {
  //       clientDataJSON: ArrayBuffer(121),
  //       attestationObject: ArrayBuffer(306),
  //   },
  //   type: 'public-key'
  // }
} catch (error) {
  // Handle Error...
}`}
            language="typescript"
            lines={[10]}
          />
        </li>
      </ol>

      <Title level={5}>Account Generation/Activation</Title>
      <ol className="list-decimal px-4">
        <li value="4">
          <p>
            If everything goes well in step 3, Clave will deploy the smart
            contract wallet (using the{' '}
            <a
              href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/AccountFactory.sol#L60"
              target="_blank"
            >
              {' '}
              deployAccount{' '}
            </a>{' '}
            function) whenever the user performs their 1st trx from the clave
            wallet (here is an{' '}
            <a
              href="https://explorer.zksync.io/tx/0xba496d2230ac8d9eef39ee74d1d1bc252e07234bac3940ff2fe443a0c25179ab"
              target="_blank"
            >
              {' '}
              example transaction{' '}
            </a>
            ). As we discussed in step 1, the smart contract wallet will be
            deployed at the counterfactual account address as we will use the
            same salt to deploy the account that was used to pre generate the
            address.
          </p>
          <Figure src="/wallets/clave/clave_account_activation.png" />
          <figcaption style={{ textAlign: 'center' }}>
            An example transaction showing how Clave wallet deploys user’s SCA
            on the first transaction from the Clave wallet (
            <a
              href="https://explorer.zksync.io/tx/0xba496d2230ac8d9eef39ee74d1d1bc252e07234bac3940ff2fe443a0c25179ab"
              target="_blank"
            >
              trx link
            </a>
            )
          </figcaption>
          <p>
            The public key (hex encoded version of <code>id</code> from
            <code>PasskeyRegistrationResult</code>) will also be passed (within
            the
            <code>initializer</code> parameter) which will set it as the{' '}
            <a
              href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/ClaveImplementation.sol#L61"
              target="_blank"
            >
              {' '}
              owner of the SCA
            </a>
            .
          </p>
        </li>
      </ol>

      <Title level={5}>Transaction Process</Title>
      <ul className="list-disc px-4">
        <li>
          <p>
            <b>Key signing</b> : The app takes a transaction message and
            forwards a signing request to the Secure Enclave. The user can then
            use biometric authentication to approve signing after which the
            Secure Enclave signs the message with the key.
          </p>
        </li>
        <li>
          <p>
            <b>Transaction verification</b> : The signed message from the Secure
            Enclave is then relayed to the bundler (which is also the sequencer
            in case of zksync due to native AA support) which sends the
            transaction to the SCA which uses a verifier contract to validate
            the secp256r1 signature. Note that in April of 2024, zksync will add
            native support for EIP-7212, and Clave can then use the native
            circuit implementation to verify secp256r1 signatures in a much
            cheaper way.
          </p>
        </li>
        <li>
          <p>
            <b>Gas abstraction/sponsership</b> : Clave wallet sponsors first few
            (~5) transactions using a paymaster.
          </p>
          <Figure src="/wallets/clave/clave_gas_abstraction.png" />
          <figcaption style={{ textAlign: 'center' }}>
            An example{' '}
            <a
              href="https://explorer.zksync.io/tx/0xba496d2230ac8d9eef39ee74d1d1bc252e07234bac3940ff2fe443a0c25179ab"
              target="_blank"
            >
              transaction
            </a>{' '}
            showing the fee paid by the{' '}
            <a
              href="https://explorer.zksync.io/address/0x10A8d22f91a326d9Fef2a8a63a5a54A6d4fBC4e8"
              target="_blank"
            >
              paymaster
            </a>
            .
          </figcaption>
        </li>
      </ul>

      <Title level={5}>Account Recovery Process</Title>
      <p>
        Clave wallet supports{' '}
        <a
          href="https://github.com/getclave/clave-contracts/blob/863213c547f161771745050b33c3af9b8f90544e/contracts/modules/recovery/SocialRecoveryModule.sol"
          target="_blank"
        >
          {' '}
          social recovery mechanism{' '}
        </a>{' '}
        where the user can assign their family or friend’s clave address as
        backup guardians. Users can decide the number of guardians that have to
        give confirmation for recovery (M our of N guardians where N ≥ M).
      </p>
      <p>
        The recovery process is conducted by{' '}
        <a
          href="https://explorer.zksync.io/address/0x9eF467CAA8291c6DAdD08EA458D763a8258B347e"
          target="_blank"
        >
          {' '}
          Clave’s smart contract{' '}
        </a>{' '}
        on zkSync. Once the user initiates the recovery flow:
      </p>
      <ol className="list-decimal px-4">
        <li>
          The user is asked to share the address (or nick name that Clave uses
          as a temporary solution before ENS is added to zksync) that needs to
          be recovered.
        </li>
        <li>
          Next, the user is asked the address (or nick name) of their guardian.
          Note that while Clave’s{' '}
          <a
            href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/modules/recovery/SocialRecoveryModule.sol#L25"
            target="_blank"
          >
            {' '}
            social recovery module
          </a>{' '}
          does support recovery using M out of N guardians, but the app
          currently only works for recovery using a single guardian (i.e. for
          all users, the{' '}
          <a
            href="https://github.com/getclave/clave-contracts/blob/d18cccd2c0bed03551d0e0ad07baf14f2da0e23e/contracts/modules/recovery/SocialRecoveryModule.sol#L24"
            target="_blank"
          >
            {' '}
            threshold
          </a>{' '}
          is set to 1).
        </li>
        <li>
          Next, a new passkey is generated (using the process discussed here).
          Your device might ask for a biometric authentication to save the newly
          generated passkey to the cloud (for eg. in case of iOS, it will be
          stored on the iCloud keychain).
        </li>
        <li>
          The app will then share a link that the user can share with your
          guardian. This link contains the details needed by the guardian to
          generate a signature to initiate the recovery process for the user.
        </li>
        <li>
          Once the guardian uses the link, they will be prompted to sign a
          message that signifies their consent to recover the user’s account.
        </li>
        <li>
          Next, the guardian will sign a transaction that calls the{' '}
          <code>
            <a
              href="https://github.com/getclave/clave-contracts/blob/863213c547f161771745050b33c3af9b8f90544e/contracts/modules/recovery/SocialRecoveryModule.sol#L125C14-L125C27"
              target="_blank"
            >
              startRecovery
            </a>
          </code>{' '}
          function which which will validate the signature from the previous
          step and start a 48-hour time lock.
        </li>
        <li>
          Once the 48-hour duration is complete, anyone can call the
          <code>
            <a
              href="https://github.com/getclave/clave-contracts/blob/863213c547f161771745050b33c3af9b8f90544e/contracts/modules/recovery/base/BaseRecovery.sol#L76"
              target="_blank"
            >
              executeRecovery
            </a>
          </code>
          function that will update the owner of the SCA with the new public key
          that we created in step 3.
        </li>
      </ol>

      <p>
        Note that the user can chose to cancel the recovery process (using the{' '}
        <code>
          <a
            href="https://github.com/getclave/clave-contracts/blob/863213c547f161771745050b33c3af9b8f90544e/contracts/modules/recovery/SocialRecoveryModule.sol#L125C14-L125C27"
            target="_blank"
          >
            startRecovery
          </a>
        </code>{' '}
        function) anytime within the 48 hours time lock period. This feature is
        useful in case the user initiated the recovery process by mistake or to
        prevent any unauthorized and malicious activities.
      </p>

      <Title level={5}>
        Migrating from another wallet (assuming migration on a single network;
        zksync)
      </Title>
      <ul className="list-disc px-4">
        <li>
          <p>
            <b>Case 1: If you are migrating from an EOA account</b>: You would
            need to transfer all your assets from your EOA to the Clave account
            contract. In future this can be made easier with (
            <a href="https://eips.ethereum.org/EIPS/eip-7377" target="_blank">
              EIP-7377 migration transaction
            </a>
            ).
          </p>
        </li>
        <li>
          <p>
            <b>Case 2: If you are migrating from a smart contract account</b>:
            You would need to transfer all your assets from your smart contract
            account to the Clave account contract. Ideally, this could be done
            in a single transaction given we can batch transactions with a smart
            contract account.
          </p>
        </li>
      </ul>

      <Title level={5}>
        Migrating to another wallet (assuming migration on a single network)
      </Title>
      <p>
        You should be able to transfer all your assets to any other address in a
        single transaction.
      </p>

      <Title level={5}>
        What happens to the wallet if clave servers/platform is down?
      </Title>
      <p>TODO</p>
    </div>
  );
}
