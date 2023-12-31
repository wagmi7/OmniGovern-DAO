import { useCallback, useState } from 'react'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { Skeleton } from '@mui/material'
import styled from '@emotion/styled'
import { providers, utils } from 'ethers'
import { Theme } from '@mui/material'
import AddressLabel from './AddressLabel'
import AmountLabel from './AmountLabel'
import getSafeInfo from '../../api/getSafeInfo'
import useApi from '../../hooks/useApi'
// import safeLogoLight from '../../assets/safe-logo-light.svg'
import usePolling from '../../hooks/usePolling'
import { useAccountAbstraction } from '../../context/accountAbstractionContext'
import { useTheme} from "../../context/themeContext"

type SafeInfoProps = {
  safeAddress: string
  chainId: string
}


function SafeInfo({ safeAddress, chainId }: SafeInfoProps) {
  const { web3Provider, chain, safeBalance } = useAccountAbstraction()

  const [isDeployed, setIsDeployed] = useState<boolean>(false)
  const [isDeployLoading, setIsDeployLoading] = useState<boolean>(true)


  // detect if the safe is deployed with polling
  const detectSafeIsDeployed = useCallback(async () => {
    const isDeployed = await isContractAddress(safeAddress, web3Provider)

    setIsDeployed(isDeployed)
    setIsDeployLoading(false)
  }, [web3Provider, safeAddress])

  usePolling(detectSafeIsDeployed)

  // safe info from Safe transaction service (used to know the threshold & owners of the Safe if its deployed)
  const fetchInfo = useCallback(
    (signal: AbortSignal) => getSafeInfo(safeAddress, chainId, { signal }),
    [safeAddress, chainId]
  )

  const { data: safeInfo, isLoading: isGetSafeInfoLoading } = useApi(fetchInfo)

  const owners = safeInfo?.owners.length || 1
  const threshold = safeInfo?.threshold || 1
  const isLoading = isDeployLoading || isGetSafeInfoLoading
  const { isDarkTheme } = useTheme();

  return (
    <Stack direction="row" spacing={2}>
      <div style={{ position: 'relative' }}>
        {/* Safe Logo */}
        {isLoading ? (
          <Skeleton variant="circular" width={50} height={50} />
        ) : (
        //   <img
        //     src={safeLogoLight}
        //     alt="connected Safe account logo"
        //     height="50px"
        //   />
          <h1>Safe Logo</h1>
        )}

        {/* Threshold & owners label */}
        {isDeployed && (
          <SafeSettingsLabel>
            <h1 className="text-xs font-bold leading-none">{threshold}/{owners}</h1>

          </SafeSettingsLabel>
        )}
      </div>

      <Stack direction="column" spacing={0.5} alignItems="flex-start">
        {/* Safe address label */}
        <h1 className="text-sm">
          <AddressLabel address={safeAddress} showBlockExplorerLink />
        </h1>

        {isLoading && <Skeleton variant="text" width={110} height={20} />}

        {!isDeployed && !isDeployLoading && (
          <CreationPendingLabel>
            <Tooltip title="This Safe is not deployed yet, it will be deployed when you execute the first transaction">
            <h1 className="text-xs font-bold">
                Creation pending
              </h1>
            </Tooltip>
          </CreationPendingLabel>
        )}

        {!isLoading && (
          <AmountContainer>
            {/* Safe Balance */}
            <h1 className='font-bold'>
              <AmountLabel
                amount={utils.formatEther(safeBalance || '0')}
                tokenSymbol={chain?.token || ''}
              />
            </h1>
          </AmountContainer>
        )}
      </Stack>
    </Stack>
  )
}

export default SafeInfo

const SafeSettingsLabel = styled('div')<{
  theme?: Theme
}>(
  ({ theme }) => `
  position: absolute;
  top: -6px;
  right: -4px;
  border-radius: 50%;
  background-color: ${theme.palette.secondary.light};
  color: ${theme.palette.getContrastText(theme.palette.secondary.light)};
  padding: 5px 6px;
`
)

const CreationPendingLabel = styled('div')<{
  theme?: Theme
}>(
  ({ theme }) => `
  border-radius: 4px;
  background-color: ${theme.palette.info.light};
  color: ${theme.palette.getContrastText(theme.palette.secondary.light)}; 
  padding: 0px 10px;
`
)

const AmountContainer = styled('div')<{
  theme?: Theme
}>(
  ({ theme, onClick }) => `
  border-radius: 6px;
  background-color: ${theme.palette.primary.light};
  padding: 0px 8px;
  cursor: ${!!onClick ? 'pointer' : 'initial'};
  `
)

// TODO: create a util for this?
const isContractAddress = async (
  address: string,
  provider?: providers.Web3Provider
): Promise<boolean> => {
  try {
    const code = await provider?.getCode(address)

    return code !== '0x'
  } catch (error) {
    return false
  }
}