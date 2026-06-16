import { Spin, type SpinProps } from "antd"
import { AnimatePresence, motion } from "motion/react"
import { Utils } from "../../utils"

const Spinner = ({
  spinProps,
  loading,
  className,
}: {
  spinProps?: SpinProps
  loading?: boolean
  className?: string
}) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={Utils.cn(
            "no-scrollbar z-100 flex w-full items-center justify-center",
            className
          )}
        >
          <Spin size="large" {...spinProps} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Spinner
